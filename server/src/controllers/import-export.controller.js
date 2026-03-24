const XLSX = require('xlsx');
const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

// ─── EXPORT ────────────────────────────────────────────────────────────

function sendWorkbook(res, wb, filename) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}

function exportItems(req, res, next) {
  try {
    const rows = queryAll('SELECT id, name, description, unit, category, created_at, updated_at FROM items ORDER BY name');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    sendWorkbook(res, wb, 'items.xlsx');
  } catch (err) {
    next(err);
  }
}

function exportSuppliers(req, res, next) {
  try {
    const rows = queryAll('SELECT id, name, contact_email, contact_phone, address, notes, created_at, updated_at FROM suppliers ORDER BY name');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    sendWorkbook(res, wb, 'suppliers.xlsx');
  } catch (err) {
    next(err);
  }
}

function exportOrders(req, res, next) {
  try {
    const rows = queryAll(
      `SELECT o.id, p.name as project_name, i.name as item_name, s.name as supplier_name,
       o.quantity, o.unit_price, o.status, o.order_date, o.expected_date, o.delivered_date, o.notes,
       u1.name as requested_by_name, u2.name as assigned_to_name, o.created_at
       FROM orders o
       LEFT JOIN projects p ON p.id = o.project_id
       LEFT JOIN items i ON i.id = o.item_id
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       LEFT JOIN users u1 ON u1.id = o.requested_by
       LEFT JOIN users u2 ON u2.id = o.assigned_to
       ORDER BY o.created_at DESC`
    );
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    sendWorkbook(res, wb, 'orders.xlsx');
  } catch (err) {
    next(err);
  }
}

function exportProjects(req, res, next) {
  try {
    const rows = queryAll(
      `SELECT p.id, p.name, p.description, p.client_name, p.status, p.start_date, p.target_date,
       u.name as created_by_name, p.created_at, p.updated_at
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by
       ORDER BY p.created_at DESC`
    );
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    sendWorkbook(res, wb, 'projects.xlsx');
  } catch (err) {
    next(err);
  }
}

function exportProjectBom(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    const rows = queryAll(
      `SELECT bl.id, i.name as item_name, i.description as item_description, i.unit, i.category,
       bl.quantity, bl.notes
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?
       ORDER BY i.category, i.name`,
      [Number(id)]
    );
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'BOM');
    sendWorkbook(res, wb, `project-${id}-bom.xlsx`);
  } catch (err) {
    next(err);
  }
}

function exportProjectMaterialList(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    const rows = queryAll(
      `SELECT i.name as item_name, i.unit, i.category, bl.quantity as required_qty,
       COALESCE(
         (SELECT SUM(o.quantity) FROM orders o
          WHERE o.project_id = bl.project_id AND o.item_id = bl.item_id AND o.status = 'Delivered'), 0
       ) as delivered_qty,
       COALESCE(
         (SELECT SUM(o.quantity) FROM orders o
          WHERE o.project_id = bl.project_id AND o.item_id = bl.item_id AND o.status NOT IN ('Cancelled','Delivered')), 0
       ) as in_pipeline_qty
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?
       ORDER BY i.category, i.name`,
      [Number(id)]
    );

    const enriched = rows.map((m) => ({
      ...m,
      readiness_pct: m.required_qty > 0 ? Math.min(100, Math.round((m.delivered_qty / m.required_qty) * 100)) : 100,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(enriched);
    XLSX.utils.book_append_sheet(wb, ws, 'Material List');
    sendWorkbook(res, wb, `project-${id}-material-list.xlsx`);
  } catch (err) {
    next(err);
  }
}

// ─── IMPORT ────────────────────────────────────────────────────────────

function parseUpload(req) {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  if (!rows.length) throw new AppError('Uploaded file has no data rows', 400);
  return rows;
}

function importItems(req, res, next) {
  try {
    const rows = parseUpload(req);
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed, row 1 is header
      if (!row.name) {
        errors.push({ row: rowNum, error: 'Missing required field: name' });
        skipped++;
        continue;
      }

      // Skip duplicates by name
      const existing = queryOne('SELECT id FROM items WHERE name = ?', [row.name]);
      if (existing) {
        skipped++;
        continue;
      }

      try {
        runAndSave(
          'INSERT INTO items (name, description, unit, category) VALUES (?, ?, ?, ?)',
          [row.name, row.description || null, row.unit || 'pcs', row.category || null]
        );
        imported++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
        skipped++;
      }
    }

    res.json({ total: rows.length, imported, skipped, errors });
  } catch (err) {
    next(err);
  }
}

function importSuppliers(req, res, next) {
  try {
    const rows = parseUpload(req);
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      if (!row.name) {
        errors.push({ row: rowNum, error: 'Missing required field: name' });
        skipped++;
        continue;
      }

      // Skip duplicates by name
      const existing = queryOne('SELECT id FROM suppliers WHERE name = ?', [row.name]);
      if (existing) {
        skipped++;
        continue;
      }

      try {
        runAndSave(
          'INSERT INTO suppliers (name, contact_email, contact_phone, address, notes) VALUES (?, ?, ?, ?, ?)',
          [row.name, row.contact_email || null, row.contact_phone || null, row.address || null, row.notes || null]
        );
        imported++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
        skipped++;
      }
    }

    res.json({ total: rows.length, imported, skipped, errors });
  } catch (err) {
    next(err);
  }
}

function importOrders(req, res, next) {
  try {
    const rows = parseUpload(req);
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // Resolve item by name or id
      let itemId = row.item_id ? Number(row.item_id) : null;
      if (!itemId && row.item_name) {
        const item = queryOne('SELECT id FROM items WHERE name = ?', [row.item_name]);
        if (item) itemId = item.id;
      }
      if (!itemId) {
        errors.push({ row: rowNum, error: 'Cannot resolve item (provide item_id or item_name)' });
        skipped++;
        continue;
      }
      if (!row.quantity) {
        errors.push({ row: rowNum, error: 'Missing required field: quantity' });
        skipped++;
        continue;
      }

      // Resolve supplier by name or id (optional)
      let supplierId = row.supplier_id ? Number(row.supplier_id) : null;
      if (!supplierId && row.supplier_name) {
        const sup = queryOne('SELECT id FROM suppliers WHERE name = ?', [row.supplier_name]);
        if (sup) supplierId = sup.id;
      }

      // Resolve project by name or id (optional)
      let projectId = row.project_id ? Number(row.project_id) : null;
      if (!projectId && row.project_name) {
        const proj = queryOne('SELECT id FROM projects WHERE name = ?', [row.project_name]);
        if (proj) projectId = proj.id;
      }

      const validStatuses = ['Pending', 'Ordered', 'Shipped', 'Delivered', 'Cancelled'];
      const status = row.status && validStatuses.includes(row.status) ? row.status : 'Pending';

      try {
        const orderId = runAndSave(
          `INSERT INTO orders (project_id, item_id, supplier_id, quantity, unit_price, status, requested_by, order_date, expected_date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            itemId,
            supplierId,
            Number(row.quantity),
            row.unit_price ? Number(row.unit_price) : null,
            status,
            req.user ? req.user.id : null,
            row.order_date || null,
            row.expected_date || null,
            row.notes || null,
          ]
        );

        // Create timeline entry
        runAndSave(
          'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
          [orderId, null, status, req.user ? req.user.id : null, 'Imported from spreadsheet']
        );

        imported++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
        skipped++;
      }
    }

    res.json({ total: rows.length, imported, skipped, errors });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  exportItems, exportSuppliers, exportOrders, exportProjects,
  exportProjectBom, exportProjectMaterialList,
  importItems, importSuppliers, importOrders,
};
