const { queryAll, queryOne } = require('../db/connection');
const { AppError } = require('../utils/errors');

function ordersSummary(req, res, next) {
  try {
    // Totals by status
    const byStatus = queryAll(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0) as total_value
       FROM orders GROUP BY status ORDER BY status`
    );

    // Totals by supplier
    const bySupplier = queryAll(
      `SELECT s.id, s.name as supplier_name, COUNT(o.id) as order_count,
       COALESCE(SUM(o.quantity * COALESCE(o.unit_price, 0)), 0) as total_value
       FROM orders o
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       GROUP BY o.supplier_id
       ORDER BY total_value DESC`
    );

    // Overall totals
    const overall = queryOne(
      `SELECT COUNT(*) as total_orders,
       COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0) as total_value,
       COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
       COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count
       FROM orders`
    );

    res.json({ overall, by_status: byStatus, by_supplier: bySupplier });
  } catch (err) {
    next(err);
  }
}

function projectSummary(req, res, next) {
  try {
    const { id } = req.params;
    const project = queryOne(
      'SELECT p.*, u.name as created_by_name FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE p.id = ?',
      [Number(id)]
    );
    if (!project) throw new AppError('Project not found', 404);

    // BOM
    const bom = queryAll(
      `SELECT bl.*, i.name as item_name, i.unit, i.category
       FROM bom_lines bl JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ? ORDER BY i.category, i.name`,
      [Number(id)]
    );

    // Orders for this project
    const orders = queryAll(
      `SELECT o.*, i.name as item_name, s.name as supplier_name
       FROM orders o
       LEFT JOIN items i ON i.id = o.item_id
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.project_id = ?
       ORDER BY o.created_at DESC`,
      [Number(id)]
    );

    // Order stats
    const orderStats = queryOne(
      `SELECT COUNT(*) as total_orders,
       COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'Ordered' THEN 1 END) as ordered,
       COUNT(CASE WHEN status = 'Shipped' THEN 1 END) as shipped,
       COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered,
       COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
       COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0) as total_value
       FROM orders WHERE project_id = ?`,
      [Number(id)]
    );

    // Material status
    const materials = queryAll(
      `SELECT bl.item_id, i.name as item_name, i.unit, bl.quantity as required_qty,
       COALESCE(
         (SELECT SUM(o.quantity) FROM orders o
          WHERE o.project_id = bl.project_id AND o.item_id = bl.item_id AND o.status = 'Delivered'), 0
       ) as delivered_qty
       FROM bom_lines bl
       JOIN items i ON i.id = bl.item_id
       WHERE bl.project_id = ?`,
      [Number(id)]
    );

    let totalRequired = 0;
    let totalDelivered = 0;
    const materialStatus = materials.map((m) => {
      const readiness = m.required_qty > 0 ? Math.min(100, Math.round((m.delivered_qty / m.required_qty) * 100)) : 100;
      totalRequired += m.required_qty;
      totalDelivered += Math.min(m.delivered_qty, m.required_qty);
      return { ...m, readiness_pct: readiness };
    });
    const overallReadiness = totalRequired > 0 ? Math.round((totalDelivered / totalRequired) * 100) : 100;

    res.json({
      project,
      bom,
      orders,
      order_stats: orderStats,
      material_status: materialStatus,
      overall_readiness_pct: overallReadiness,
    });
  } catch (err) {
    next(err);
  }
}

function procurementStatus(req, res, next) {
  try {
    // Per-project procurement overview
    const projects = queryAll(
      `SELECT p.id, p.name, p.status, p.client_name,
       (SELECT COUNT(*) FROM bom_lines bl WHERE bl.project_id = p.id) as bom_items,
       (SELECT COUNT(*) FROM orders o WHERE o.project_id = p.id) as total_orders,
       (SELECT COUNT(*) FROM orders o WHERE o.project_id = p.id AND o.status = 'Delivered') as delivered_orders,
       (SELECT COUNT(*) FROM orders o WHERE o.project_id = p.id AND o.status = 'Pending') as pending_orders,
       (SELECT COALESCE(SUM(o.quantity * COALESCE(o.unit_price, 0)), 0) FROM orders o WHERE o.project_id = p.id) as total_value
       FROM projects p
       ORDER BY p.created_at DESC`
    );

    // Overall summary
    const overall = queryOne(
      `SELECT
       (SELECT COUNT(*) FROM projects WHERE status = 'Active') as active_projects,
       (SELECT COUNT(*) FROM orders) as total_orders,
       (SELECT COUNT(*) FROM orders WHERE status = 'Pending') as pending_orders,
       (SELECT COUNT(*) FROM orders WHERE status = 'Ordered') as ordered_orders,
       (SELECT COUNT(*) FROM orders WHERE status = 'Shipped') as shipped_orders,
       (SELECT COUNT(*) FROM orders WHERE status = 'Delivered') as delivered_orders,
       (SELECT COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0) FROM orders) as total_value`
    );

    res.json({ overall, projects });
  } catch (err) {
    next(err);
  }
}

function supplierPerformance(req, res, next) {
  try {
    const suppliers = queryAll(
      `SELECT s.id, s.name, s.contact_email,
       COUNT(o.id) as total_orders,
       COUNT(CASE WHEN o.status = 'Delivered' THEN 1 END) as delivered_orders,
       COALESCE(SUM(o.quantity * COALESCE(o.unit_price, 0)), 0) as total_value,
       ROUND(AVG(CASE
         WHEN o.status = 'Delivered' AND o.delivered_date IS NOT NULL AND o.order_date IS NOT NULL
         THEN CAST(julianday(o.delivered_date) - julianday(o.order_date) AS INTEGER)
       END), 1) as avg_lead_time_days,
       CASE
         WHEN COUNT(CASE WHEN o.status = 'Delivered' THEN 1 END) = 0 THEN NULL
         ELSE ROUND(
           100.0 * COUNT(CASE
             WHEN o.status = 'Delivered' AND o.delivered_date IS NOT NULL AND o.expected_date IS NOT NULL
             AND o.delivered_date <= o.expected_date THEN 1
           END) / COUNT(CASE WHEN o.status = 'Delivered' THEN 1 END),
         1)
       END as on_time_delivery_pct
       FROM suppliers s
       LEFT JOIN orders o ON o.supplier_id = s.id
       GROUP BY s.id
       ORDER BY total_orders DESC`
    );

    res.json(suppliers);
  } catch (err) {
    next(err);
  }
}

module.exports = { ordersSummary, projectSummary, procurementStatus, supplierPerformance };
