const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function listOrders(req, res, next) {
  try {
    const { status, project_id, assigned_to } = req.query;
    let sql = `SELECT o.*, i.name as item_name, s.name as supplier_name, p.name as project_name,
               u1.name as requested_by_name, u2.name as assigned_to_name
               FROM orders o
               LEFT JOIN items i ON i.id = o.item_id
               LEFT JOIN suppliers s ON s.id = o.supplier_id
               LEFT JOIN projects p ON p.id = o.project_id
               LEFT JOIN users u1 ON u1.id = o.requested_by
               LEFT JOIN users u2 ON u2.id = o.assigned_to
               WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (project_id) {
      sql += ' AND o.project_id = ?';
      params.push(Number(project_id));
    }
    if (assigned_to) {
      sql += ' AND o.assigned_to = ?';
      params.push(Number(assigned_to));
    }
    sql += ' ORDER BY o.created_at DESC';

    res.json(queryAll(sql, params));
  } catch (err) {
    next(err);
  }
}

function getOrder(req, res, next) {
  try {
    const order = queryOne(
      `SELECT o.*, i.name as item_name, s.name as supplier_name, p.name as project_name,
       u1.name as requested_by_name, u2.name as assigned_to_name
       FROM orders o
       LEFT JOIN items i ON i.id = o.item_id
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       LEFT JOIN projects p ON p.id = o.project_id
       LEFT JOIN users u1 ON u1.id = o.requested_by
       LEFT JOIN users u2 ON u2.id = o.assigned_to
       WHERE o.id = ?`,
      [Number(req.params.id)]
    );
    if (!order) throw new AppError('Order not found', 404);

    const timeline = queryAll(
      `SELECT ot.*, u.name as changed_by_name
       FROM order_timeline ot
       LEFT JOIN users u ON u.id = ot.changed_by
       WHERE ot.order_id = ?
       ORDER BY ot.changed_at ASC`,
      [order.id]
    );

    res.json({ ...order, timeline });
  } catch (err) {
    next(err);
  }
}

function createOrder(req, res, next) {
  try {
    const { project_id, item_id, supplier_id, quantity, unit_price, status, assigned_to, order_date, expected_date, notes } = req.body;
    if (!item_id || !quantity) throw new AppError('item_id and quantity are required', 400);

    const initialStatus = status || 'Pending';
    const id = runAndSave(
      `INSERT INTO orders (project_id, item_id, supplier_id, quantity, unit_price, status, requested_by, assigned_to, order_date, expected_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id || null,
        Number(item_id),
        supplier_id || null,
        Number(quantity),
        unit_price || null,
        initialStatus,
        req.user.id,
        assigned_to || null,
        order_date || null,
        expected_date || null,
        notes || null,
      ]
    );

    // Create timeline entry
    runAndSave(
      'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
      [id, null, initialStatus, req.user.id, 'Order created']
    );

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM orders WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Order not found', 404);

    const { project_id, item_id, supplier_id, quantity, unit_price, assigned_to, order_date, expected_date, delivered_date, notes } = req.body;
    runAndSave(
      `UPDATE orders SET project_id = ?, item_id = ?, supplier_id = ?, quantity = ?, unit_price = ?,
       assigned_to = ?, order_date = ?, expected_date = ?, delivered_date = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        project_id ?? existing.project_id,
        item_id ?? existing.item_id,
        supplier_id ?? existing.supplier_id,
        quantity ?? existing.quantity,
        unit_price ?? existing.unit_price,
        assigned_to ?? existing.assigned_to,
        order_date ?? existing.order_date,
        expected_date ?? existing.expected_date,
        delivered_date ?? existing.delivered_date,
        notes ?? existing.notes,
        Number(id),
      ]
    );

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [Number(id)]);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

function changeOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!status) throw new AppError('status is required', 400);

    const validStatuses = ['Pending', 'Ordered', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const existing = queryOne('SELECT * FROM orders WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Order not found', 404);

    const fromStatus = existing.status;

    let extraFields = '';
    if (status === 'Ordered' && !existing.order_date) {
      extraFields = ", order_date = datetime('now')";
    }
    if (status === 'Delivered' && !existing.delivered_date) {
      extraFields = ", delivered_date = datetime('now')";
    }

    runAndSave(
      `UPDATE orders SET status = ?, updated_at = datetime('now')${extraFields} WHERE id = ?`,
      [status, Number(id)]
    );

    // Create timeline entry
    runAndSave(
      'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
      [Number(id), fromStatus, status, req.user.id, note || `Status changed from ${fromStatus} to ${status}`]
    );

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [Number(id)]);
    const timeline = queryAll(
      `SELECT ot.*, u.name as changed_by_name
       FROM order_timeline ot
       LEFT JOIN users u ON u.id = ot.changed_by
       WHERE ot.order_id = ?
       ORDER BY ot.changed_at ASC`,
      [order.id]
    );

    res.json({ ...order, timeline });
  } catch (err) {
    next(err);
  }
}

module.exports = { listOrders, getOrder, createOrder, updateOrder, changeOrderStatus };
