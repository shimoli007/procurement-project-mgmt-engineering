const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');
const { logAudit } = require('../utils/audit');
const { createNotification } = require('../utils/notify');

function listProjects(req, res, next) {
  try {
    const { status } = req.query;
    let sql = `SELECT p.*, u.name as created_by_name FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY p.created_at DESC';
    res.json(queryAll(sql, params));
  } catch (err) {
    next(err);
  }
}

function getProject(req, res, next) {
  try {
    const project = queryOne(
      'SELECT p.*, u.name as created_by_name FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE p.id = ?',
      [Number(req.params.id)]
    );
    if (!project) throw new AppError('Project not found', 404);

    const bom = queryAll(
      `SELECT bl.*, i.name as item_name, i.unit, i.category
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?
       ORDER BY i.category, i.name`,
      [project.id]
    );

    const orderCount = queryOne(
      'SELECT COUNT(*) as count FROM orders WHERE project_id = ?',
      [project.id]
    );

    res.json({ ...project, bom, order_count: orderCount ? orderCount.count : 0 });
  } catch (err) {
    next(err);
  }
}

function createProject(req, res, next) {
  try {
    const { name, description, client_name, status, start_date, target_date } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const id = runAndSave(
      'INSERT INTO projects (name, description, client_name, status, start_date, target_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, client_name || null, status || 'Active', start_date || null, target_date || null, req.user.id]
    );
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    logAudit(req.user.id, 'create', 'project', id, null, project);

    // Notify all Procurement users about new project
    const procurementUsers = queryAll("SELECT id FROM users WHERE role = 'Procurement' AND id != ?", [req.user.id]);
    for (const u of procurementUsers) {
      createNotification(
        u.id, 'project_created', 'New Project Created',
        `Project "${name}" has been created`, 'project', id
      );
    }

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Project not found', 404);

    const { name, description, client_name, status, start_date, target_date } = req.body;
    runAndSave(
      `UPDATE projects SET name = ?, description = ?, client_name = ?, status = ?, start_date = ?, target_date = ?, updated_at = datetime('now') WHERE id = ?`,
      [
        name ?? existing.name,
        description ?? existing.description,
        client_name ?? existing.client_name,
        status ?? existing.status,
        start_date ?? existing.start_date,
        target_date ?? existing.target_date,
        Number(id),
      ]
    );
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    logAudit(req.user.id, 'update', 'project', Number(id), existing, project);
    res.json(project);
  } catch (err) {
    next(err);
  }
}

function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('Project not found', 404);

    runAndSave('DELETE FROM projects WHERE id = ?', [Number(id)]);
    logAudit(req.user.id, 'delete', 'project', Number(id), existing, null);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}

// BOM operations
function getBom(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    const bom = queryAll(
      `SELECT bl.*, i.name as item_name, i.unit, i.category, i.description as item_description
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?
       ORDER BY i.category, i.name`,
      [Number(id)]
    );
    res.json(bom);
  } catch (err) {
    next(err);
  }
}

function addBomLine(req, res, next) {
  try {
    const { id } = req.params;
    const { item_id, quantity, notes } = req.body;
    if (!item_id) throw new AppError('item_id is required', 400);

    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    const item = queryOne('SELECT * FROM items WHERE id = ?', [Number(item_id)]);
    if (!item) throw new AppError('Item not found', 404);

    const lineId = runAndSave(
      'INSERT INTO bom_lines (project_id, item_id, quantity, notes) VALUES (?, ?, ?, ?)',
      [Number(id), Number(item_id), quantity || 1, notes || null]
    );
    const line = queryOne(
      `SELECT bl.*, i.name as item_name, i.unit, i.category
       FROM bom_lines bl JOIN items i ON i.id = bl.item_id WHERE bl.id = ?`,
      [lineId]
    );
    res.status(201).json(line);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return next(new AppError('This item is already in the BOM for this project', 409));
    }
    next(err);
  }
}

function updateBomLine(req, res, next) {
  try {
    const { id, lineId } = req.params;
    const existing = queryOne('SELECT * FROM bom_lines WHERE id = ? AND project_id = ?', [Number(lineId), Number(id)]);
    if (!existing) throw new AppError('BOM line not found', 404);

    const { quantity, notes } = req.body;
    runAndSave(
      'UPDATE bom_lines SET quantity = ?, notes = ? WHERE id = ?',
      [quantity ?? existing.quantity, notes ?? existing.notes, Number(lineId)]
    );
    const line = queryOne(
      `SELECT bl.*, i.name as item_name, i.unit, i.category
       FROM bom_lines bl JOIN items i ON i.id = bl.item_id WHERE bl.id = ?`,
      [Number(lineId)]
    );
    res.json(line);
  } catch (err) {
    next(err);
  }
}

function deleteBomLine(req, res, next) {
  try {
    const { id, lineId } = req.params;
    const existing = queryOne('SELECT * FROM bom_lines WHERE id = ? AND project_id = ?', [Number(lineId), Number(id)]);
    if (!existing) throw new AppError('BOM line not found', 404);

    runAndSave('DELETE FROM bom_lines WHERE id = ?', [Number(lineId)]);
    res.json({ message: 'BOM line deleted' });
  } catch (err) {
    next(err);
  }
}

function generateOrders(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    // Get BOM lines that don't have existing orders for this project
    const bomLines = queryAll(
      `SELECT bl.*, i.name as item_name
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM orders o WHERE o.project_id = bl.project_id AND o.item_id = bl.item_id AND o.status != 'Cancelled'
       )`,
      [Number(id)]
    );

    if (bomLines.length === 0) {
      return res.json({ message: 'All BOM items already have orders', orders: [] });
    }

    const createdOrders = [];
    for (const line of bomLines) {
      // Find preferred supplier
      const preferred = queryOne(
        'SELECT * FROM item_suppliers WHERE item_id = ? ORDER BY is_preferred DESC, unit_price ASC LIMIT 1',
        [line.item_id]
      );

      const orderId = runAndSave(
        `INSERT INTO orders (project_id, item_id, supplier_id, quantity, unit_price, status, requested_by, notes)
         VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
        [
          Number(id),
          line.item_id,
          preferred ? preferred.supplier_id : null,
          line.quantity,
          preferred ? preferred.unit_price : null,
          req.user.id,
          `Auto-generated from BOM for ${project.name}`,
        ]
      );

      // Create timeline entry
      runAndSave(
        'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
        [orderId, null, 'Pending', req.user.id, 'Order auto-generated from BOM']
      );

      const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
      createdOrders.push(order);
    }

    res.status(201).json({ message: `${createdOrders.length} orders created`, orders: createdOrders });
  } catch (err) {
    next(err);
  }
}

function getMaterialList(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
    if (!project) throw new AppError('Project not found', 404);

    const materials = queryAll(
      `SELECT bl.item_id, i.name as item_name, i.unit, i.category, bl.quantity as required_qty,
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

    let totalRequired = 0;
    let totalDelivered = 0;
    const enriched = materials.map((m) => {
      const readiness = m.required_qty > 0 ? Math.min(100, Math.round((m.delivered_qty / m.required_qty) * 100)) : 100;
      totalRequired += m.required_qty;
      totalDelivered += Math.min(m.delivered_qty, m.required_qty);
      return { ...m, readiness_pct: readiness };
    });

    const overallReadiness = totalRequired > 0 ? Math.round((totalDelivered / totalRequired) * 100) : 100;

    res.json({ project_id: project.id, project_name: project.name, overall_readiness_pct: overallReadiness, materials: enriched });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects, getProject, createProject, updateProject, deleteProject,
  getBom, addBomLine, updateBomLine, deleteBomLine,
  generateOrders, getMaterialList,
};
