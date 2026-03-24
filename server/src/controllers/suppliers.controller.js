const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function listSuppliers(req, res, next) {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR contact_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY name';
    res.json(queryAll(sql, params));
  } catch (err) {
    next(err);
  }
}

function getSupplier(req, res, next) {
  try {
    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [Number(req.params.id)]);
    if (!supplier) throw new AppError('Supplier not found', 404);

    const items = queryAll(
      `SELECT i.*, isp.unit_price, isp.lead_time_days, isp.is_preferred
       FROM item_suppliers isp
       JOIN items i ON i.id = isp.item_id
       WHERE isp.supplier_id = ?`,
      [supplier.id]
    );

    res.json({ ...supplier, items });
  } catch (err) {
    next(err);
  }
}

function createSupplier(req, res, next) {
  try {
    const { name, contact_email, contact_phone, address, notes } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const id = runAndSave(
      'INSERT INTO suppliers (name, contact_email, contact_phone, address, notes) VALUES (?, ?, ?, ?, ?)',
      [name, contact_email || null, contact_phone || null, address || null, notes || null]
    );
    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM suppliers WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Supplier not found', 404);

    const { name, contact_email, contact_phone, address, notes } = req.body;
    runAndSave(
      `UPDATE suppliers SET name = ?, contact_email = ?, contact_phone = ?, address = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
      [
        name ?? existing.name,
        contact_email ?? existing.contact_email,
        contact_phone ?? existing.contact_phone,
        address ?? existing.address,
        notes ?? existing.notes,
        Number(id),
      ]
    );
    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [Number(id)]);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM suppliers WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Supplier not found', 404);

    runAndSave('DELETE FROM suppliers WHERE id = ?', [Number(id)]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
