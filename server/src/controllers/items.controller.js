const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');
const { logAudit } = require('../utils/audit');

function listItems(req, res, next) {
  try {
    const { search, category } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR item_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name';

    const items = queryAll(sql, params);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

function getItem(req, res, next) {
  try {
    const item = queryOne('SELECT * FROM items WHERE id = ?', [Number(req.params.id)]);
    if (!item) throw new AppError('Item not found', 404);

    const suppliers = queryAll(
      `SELECT s.*, isp.unit_price, isp.lead_time_days, isp.is_preferred, isp.id as link_id
       FROM item_suppliers isp
       JOIN suppliers s ON s.id = isp.supplier_id
       WHERE isp.item_id = ?`,
      [item.id]
    );

    res.json({ ...item, suppliers });
  } catch (err) {
    next(err);
  }
}

function createItem(req, res, next) {
  try {
    const { name, item_code, description, unit, category } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const id = runAndSave(
      'INSERT INTO items (name, item_code, description, unit, category) VALUES (?, ?, ?, ?, ?)',
      [name, item_code || null, description || null, unit || 'pcs', category || null]
    );
    const item = queryOne('SELECT * FROM items WHERE id = ?', [id]);
    logAudit(req.user ? req.user.id : null, 'create', 'item', id, null, item);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM items WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Item not found', 404);

    const { name, item_code, description, unit, category } = req.body;
    runAndSave(
      `UPDATE items SET name = ?, item_code = ?, description = ?, unit = ?, category = ?, updated_at = datetime('now') WHERE id = ?`,
      [
        name ?? existing.name,
        item_code !== undefined ? item_code : existing.item_code,
        description ?? existing.description,
        unit ?? existing.unit,
        category ?? existing.category,
        Number(id),
      ]
    );
    const item = queryOne('SELECT * FROM items WHERE id = ?', [Number(id)]);
    logAudit(req.user ? req.user.id : null, 'update', 'item', Number(id), existing, item);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM items WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Item not found', 404);

    runAndSave('DELETE FROM items WHERE id = ?', [Number(id)]);
    logAudit(req.user ? req.user.id : null, 'delete', 'item', Number(id), existing, null);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

function getItemSuppliers(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM items WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Item not found', 404);

    const suppliers = queryAll(
      `SELECT s.*, isp.unit_price, isp.lead_time_days, isp.is_preferred, isp.id as link_id
       FROM item_suppliers isp
       JOIN suppliers s ON s.id = isp.supplier_id
       WHERE isp.item_id = ?`,
      [Number(id)]
    );
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
}

function addItemSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { supplier_id, unit_price, lead_time_days, is_preferred } = req.body;

    if (!supplier_id) throw new AppError('supplier_id is required', 400);

    const item = queryOne('SELECT * FROM items WHERE id = ?', [Number(id)]);
    if (!item) throw new AppError('Item not found', 404);

    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [Number(supplier_id)]);
    if (!supplier) throw new AppError('Supplier not found', 404);

    const linkId = runAndSave(
      'INSERT INTO item_suppliers (item_id, supplier_id, unit_price, lead_time_days, is_preferred) VALUES (?, ?, ?, ?, ?)',
      [Number(id), Number(supplier_id), unit_price || null, lead_time_days || null, is_preferred ? 1 : 0]
    );
    const link = queryOne('SELECT * FROM item_suppliers WHERE id = ?', [linkId]);
    res.status(201).json(link);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return next(new AppError('This supplier is already linked to this item', 409));
    }
    next(err);
  }
}

function removeItemSupplier(req, res, next) {
  try {
    const { id, supplierId } = req.params;
    const link = queryOne(
      'SELECT * FROM item_suppliers WHERE item_id = ? AND supplier_id = ?',
      [Number(id), Number(supplierId)]
    );
    if (!link) throw new AppError('Item-supplier link not found', 404);

    runAndSave('DELETE FROM item_suppliers WHERE item_id = ? AND supplier_id = ?', [Number(id), Number(supplierId)]);
    res.json({ message: 'Supplier removed from item' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, getItemSuppliers, addItemSupplier, removeItemSupplier };
