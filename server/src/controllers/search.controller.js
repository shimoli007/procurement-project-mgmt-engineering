const { queryAll } = require('../db/connection');

function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.json({ items: [], suppliers: [], projects: [], orders: [] });
    }

    const term = `%${q}%`;

    const items = queryAll(
      `SELECT * FROM items
       WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
       LIMIT 10`,
      [term, term, term]
    );

    const suppliers = queryAll(
      `SELECT * FROM suppliers
       WHERE name LIKE ? OR contact_email LIKE ?
       LIMIT 10`,
      [term, term]
    );

    const projects = queryAll(
      `SELECT * FROM projects
       WHERE name LIKE ? OR description LIKE ? OR client_name LIKE ?
       LIMIT 10`,
      [term, term, term]
    );

    const orders = queryAll(
      `SELECT * FROM orders
       WHERE notes LIKE ?
       LIMIT 10`,
      [term]
    );

    res.json({ items, suppliers, projects, orders });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
