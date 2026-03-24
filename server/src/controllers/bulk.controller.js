const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function bulkUpdateOrderStatus(req, res, next) {
  try {
    const { orderIds, status } = req.body;
    if (!Array.isArray(orderIds) || !orderIds.length) throw new AppError('orderIds array is required', 400);
    if (!status) throw new AppError('status is required', 400);

    const validStatuses = ['Pending', 'Ordered', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Validate all IDs exist
    const existing = queryAll(
      `SELECT id, status FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds.map(Number)
    );
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = orderIds.filter((id) => !existingIds.has(Number(id)));
    if (missing.length) {
      throw new AppError(`Orders not found: ${missing.join(', ')}`, 404);
    }

    let successCount = 0;
    const failures = [];

    for (const order of existing) {
      try {
        let extraFields = '';
        if (status === 'Ordered') extraFields = ", order_date = COALESCE(order_date, datetime('now'))";
        if (status === 'Delivered') extraFields = ", delivered_date = COALESCE(delivered_date, datetime('now'))";

        runAndSave(
          `UPDATE orders SET status = ?, updated_at = datetime('now')${extraFields} WHERE id = ?`,
          [status, order.id]
        );

        // Create timeline entry
        runAndSave(
          'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
          [order.id, order.status, status, req.user.id, `Bulk status update to ${status}`]
        );

        successCount++;
      } catch (err) {
        failures.push({ id: order.id, error: err.message });
      }
    }

    res.json({ success: successCount, failures });
  } catch (err) {
    next(err);
  }
}

function bulkAssignOrders(req, res, next) {
  try {
    const { orderIds, assignedTo } = req.body;
    if (!Array.isArray(orderIds) || !orderIds.length) throw new AppError('orderIds array is required', 400);
    if (assignedTo === undefined || assignedTo === null) throw new AppError('assignedTo is required', 400);

    // Validate assignee exists
    const user = queryOne('SELECT id FROM users WHERE id = ?', [Number(assignedTo)]);
    if (!user) throw new AppError('Assigned user not found', 404);

    // Validate all order IDs exist
    const existing = queryAll(
      `SELECT id FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds.map(Number)
    );
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = orderIds.filter((id) => !existingIds.has(Number(id)));
    if (missing.length) {
      throw new AppError(`Orders not found: ${missing.join(', ')}`, 404);
    }

    let successCount = 0;
    const failures = [];

    for (const order of existing) {
      try {
        runAndSave(
          `UPDATE orders SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?`,
          [Number(assignedTo), order.id]
        );
        successCount++;
      } catch (err) {
        failures.push({ id: order.id, error: err.message });
      }
    }

    res.json({ success: successCount, failures });
  } catch (err) {
    next(err);
  }
}

function bulkDeleteOrders(req, res, next) {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || !orderIds.length) throw new AppError('orderIds array is required', 400);

    // Validate all IDs exist
    const existing = queryAll(
      `SELECT id FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds.map(Number)
    );
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = orderIds.filter((id) => !existingIds.has(Number(id)));
    if (missing.length) {
      throw new AppError(`Orders not found: ${missing.join(', ')}`, 404);
    }

    let successCount = 0;
    const failures = [];

    for (const order of existing) {
      try {
        runAndSave('DELETE FROM orders WHERE id = ?', [order.id]);
        successCount++;
      } catch (err) {
        failures.push({ id: order.id, error: err.message });
      }
    }

    res.json({ success: successCount, failures });
  } catch (err) {
    next(err);
  }
}

function bulkDeleteItems(req, res, next) {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || !itemIds.length) throw new AppError('itemIds array is required', 400);

    // Validate all IDs exist
    const existing = queryAll(
      `SELECT id FROM items WHERE id IN (${itemIds.map(() => '?').join(',')})`,
      itemIds.map(Number)
    );
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = itemIds.filter((id) => !existingIds.has(Number(id)));
    if (missing.length) {
      throw new AppError(`Items not found: ${missing.join(', ')}`, 404);
    }

    let successCount = 0;
    const failures = [];

    for (const item of existing) {
      try {
        runAndSave('DELETE FROM items WHERE id = ?', [item.id]);
        successCount++;
      } catch (err) {
        failures.push({ id: item.id, error: err.message });
      }
    }

    res.json({ success: successCount, failures });
  } catch (err) {
    next(err);
  }
}

function bulkUpdateItemCategory(req, res, next) {
  try {
    const { itemIds, category } = req.body;
    if (!Array.isArray(itemIds) || !itemIds.length) throw new AppError('itemIds array is required', 400);
    if (category === undefined) throw new AppError('category is required', 400);

    // Validate all IDs exist
    const existing = queryAll(
      `SELECT id FROM items WHERE id IN (${itemIds.map(() => '?').join(',')})`,
      itemIds.map(Number)
    );
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = itemIds.filter((id) => !existingIds.has(Number(id)));
    if (missing.length) {
      throw new AppError(`Items not found: ${missing.join(', ')}`, 404);
    }

    let successCount = 0;
    const failures = [];

    for (const item of existing) {
      try {
        runAndSave(
          `UPDATE items SET category = ?, updated_at = datetime('now') WHERE id = ?`,
          [category, item.id]
        );
        successCount++;
      } catch (err) {
        failures.push({ id: item.id, error: err.message });
      }
    }

    res.json({ success: successCount, failures });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  bulkUpdateOrderStatus, bulkAssignOrders, bulkDeleteOrders,
  bulkDeleteItems, bulkUpdateItemCategory,
};
