const { queryAll, queryOne } = require('../db/connection');

function getSummary(req, res, next) {
  try {
    const totalProjects = queryOne('SELECT COUNT(*) as count FROM projects');
    const activeProjects = queryOne("SELECT COUNT(*) as count FROM projects WHERE status = 'Active'");
    const totalOrders = queryOne('SELECT COUNT(*) as count FROM orders');
    const pendingOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'");
    const orderedOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'Ordered'");
    const shippedOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'Shipped'");
    const deliveredOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'Delivered'");
    const totalItems = queryOne('SELECT COUNT(*) as count FROM items');
    const totalSuppliers = queryOne('SELECT COUNT(*) as count FROM suppliers');
    const totalValue = queryOne("SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM orders WHERE status != 'Cancelled'");
    const overdueOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE expected_date < datetime('now') AND status NOT IN ('Delivered', 'Cancelled')");

    res.json({
      projects: {
        total: totalProjects.count,
        active: activeProjects.count,
      },
      orders: {
        total: totalOrders.count,
        pending: pendingOrders.count,
        ordered: orderedOrders.count,
        shipped: shippedOrders.count,
        delivered: deliveredOrders.count,
        overdue: overdueOrders.count,
      },
      items: totalItems.count,
      suppliers: totalSuppliers.count,
      total_order_value: totalValue.total,
    });
  } catch (err) {
    next(err);
  }
}

function getRecentOrders(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 10;
    const orders = queryAll(
      `SELECT o.*, i.name as item_name, s.name as supplier_name, p.name as project_name
       FROM orders o
       LEFT JOIN items i ON i.id = o.item_id
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       LEFT JOIN projects p ON p.id = o.project_id
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

function getProjectReadiness(req, res, next) {
  try {
    const projects = queryAll("SELECT * FROM projects WHERE status = 'Active' ORDER BY name");

    const result = projects.map((project) => {
      const bomLines = queryAll(
        'SELECT bl.item_id, bl.quantity FROM bom_lines bl WHERE bl.project_id = ?',
        [project.id]
      );

      if (bomLines.length === 0) {
        return { id: project.id, name: project.name, client_name: project.client_name, bom_items: 0, readiness_pct: 100 };
      }

      let totalRequired = 0;
      let totalDelivered = 0;

      for (const line of bomLines) {
        totalRequired += line.quantity;
        const delivered = queryOne(
          "SELECT COALESCE(SUM(quantity), 0) as qty FROM orders WHERE project_id = ? AND item_id = ? AND status = 'Delivered'",
          [project.id, line.item_id]
        );
        totalDelivered += Math.min(delivered.qty, line.quantity);
      }

      const readiness = totalRequired > 0 ? Math.round((totalDelivered / totalRequired) * 100) : 100;
      return { id: project.id, name: project.name, client_name: project.client_name, bom_items: bomLines.length, readiness_pct: readiness };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getRecentOrders, getProjectReadiness };
