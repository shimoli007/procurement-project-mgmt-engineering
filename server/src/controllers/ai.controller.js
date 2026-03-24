const { queryAll, queryOne } = require('../db/connection');
const { AppError } = require('../utils/errors');

// Helper: normalize a value to 0-100 score (lower is better for price/lead time)
function invertScore(value, min, max) {
  if (max === min) return 100;
  return Math.round(((max - value) / (max - min)) * 100);
}

// Helper: normalize a value to 0-100 score (higher is better)
function directScore(value, min, max) {
  if (max === min) return 100;
  return Math.round(((value - min) / (max - min)) * 100);
}

function getSupplierRecommendations(req, res, next) {
  try {
    const { itemId } = req.params;

    // Get all suppliers for this item
    const suppliers = queryAll(`
      SELECT
        isup.supplier_id, s.name as supplier_name,
        isup.unit_price, isup.lead_time_days, isup.is_preferred
      FROM item_suppliers isup
      JOIN suppliers s ON s.id = isup.supplier_id
      WHERE isup.item_id = ?
    `, [Number(itemId)]);

    if (suppliers.length === 0) {
      return res.json({ recommendations: [], message: 'No suppliers found for this item' });
    }

    // For each supplier, get order history
    const scored = suppliers.map(sup => {
      const orders = queryAll(`
        SELECT id, status, order_date, expected_date, delivered_date, quantity, unit_price
        FROM orders
        WHERE item_id = ? AND supplier_id = ?
      `, [Number(itemId), sup.supplier_id]);

      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(o => o.status === 'Delivered');
      const onTimeDeliveries = deliveredOrders.filter(o => {
        if (!o.delivered_date || !o.expected_date) return true;
        return o.delivered_date <= o.expected_date;
      });

      const avgPrice = sup.unit_price || 0;
      const avgLeadTime = sup.lead_time_days || 0;
      const onTimePct = deliveredOrders.length > 0
        ? Math.round((onTimeDeliveries.length / deliveredOrders.length) * 100)
        : 100; // assume good if no history

      return {
        supplier_id: sup.supplier_id,
        supplier_name: sup.supplier_name,
        unit_price: avgPrice,
        lead_time_days: avgLeadTime,
        is_preferred: sup.is_preferred,
        total_orders: totalOrders,
        delivered_orders: deliveredOrders.length,
        on_time_pct: onTimePct,
      };
    });

    // Calculate normalized scores
    const prices = scored.map(s => s.unit_price);
    const leadTimes = scored.map(s => s.lead_time_days);
    const reliabilities = scored.map(s => s.on_time_pct);
    const experiences = scored.map(s => s.total_orders);

    const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
    const minLead = Math.min(...leadTimes), maxLead = Math.max(...leadTimes);
    const minRel = Math.min(...reliabilities), maxRel = Math.max(...reliabilities);
    const minExp = Math.min(...experiences), maxExp = Math.max(...experiences);

    const recommendations = scored.map(s => {
      const priceScore = invertScore(s.unit_price, minPrice, maxPrice);
      const leadTimeScore = invertScore(s.lead_time_days, minLead, maxLead);
      const reliabilityScore = directScore(s.on_time_pct, minRel, maxRel);
      const experienceScore = directScore(s.total_orders, minExp, maxExp);

      const overallScore = Math.round(
        (0.3 * priceScore) + (0.3 * leadTimeScore) + (0.25 * reliabilityScore) + (0.15 * experienceScore)
      );

      // Generate reasoning
      const reasons = [];
      if (priceScore >= 80) reasons.push('Competitive pricing');
      if (leadTimeScore >= 80) reasons.push('Fast delivery');
      if (reliabilityScore >= 80) reasons.push('Highly reliable');
      if (experienceScore >= 80) reasons.push('Extensive order history');
      if (s.is_preferred) reasons.push('Preferred supplier');
      if (reasons.length === 0) reasons.push('Standard supplier option');

      // Determine badges
      const badges = [];
      if (overallScore === Math.max(...scored.map(() => overallScore))) badges.push('Best Value');

      return {
        ...s,
        price_score: priceScore,
        lead_time_score: leadTimeScore,
        reliability_score: reliabilityScore,
        experience_score: experienceScore,
        overall_score: overallScore,
        reasoning: reasons.join('. ') + '.',
        badges,
      };
    });

    // Sort by overall score descending
    recommendations.sort((a, b) => b.overall_score - a.overall_score);

    // Assign badges to top in each category
    if (recommendations.length > 0) {
      const bestPrice = [...recommendations].sort((a, b) => a.unit_price - b.unit_price)[0];
      const fastest = [...recommendations].sort((a, b) => a.lead_time_days - b.lead_time_days)[0];
      const mostReliable = [...recommendations].sort((a, b) => b.on_time_pct - a.on_time_pct)[0];

      recommendations.forEach(r => {
        if (r.supplier_id === bestPrice.supplier_id && !r.badges.includes('Best Value')) r.badges.push('Best Value');
        if (r.supplier_id === fastest.supplier_id) r.badges.push('Fastest');
        if (r.supplier_id === mostReliable.supplier_id) r.badges.push('Most Reliable');
      });

      // Ensure rank 1 has Best Value if not already
      if (!recommendations[0].badges.includes('Best Value') && recommendations[0].overall_score === recommendations[0].overall_score) {
        // keep as is
      }
    }

    res.json({ recommendations });
  } catch (err) {
    next(err);
  }
}

function getDemandForecast(req, res, next) {
  try {
    const { itemId } = req.params;

    // Get orders for this item in the last 12 months grouped by month
    const history = queryAll(`
      SELECT
        strftime('%Y-%m', order_date) as month,
        SUM(quantity) as quantity
      FROM orders
      WHERE item_id = ?
        AND order_date IS NOT NULL
        AND order_date >= date('now', '-12 months')
        AND status != 'Cancelled'
      GROUP BY strftime('%Y-%m', order_date)
      ORDER BY month
    `, [Number(itemId)]);

    if (history.length === 0) {
      return res.json({
        history: [],
        forecast: [],
        trend: 'stable',
        avg_monthly: 0,
        message: 'No order history available for forecasting',
      });
    }

    const quantities = history.map(h => h.quantity);
    const avgMonthly = Math.round(quantities.reduce((a, b) => a + b, 0) / quantities.length);

    // Simple linear regression for trend
    let trend = 'stable';
    let slope = 0;
    if (quantities.length >= 2) {
      const n = quantities.length;
      const xMean = (n - 1) / 2;
      const yMean = quantities.reduce((a, b) => a + b, 0) / n;
      let numerator = 0, denominator = 0;
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (quantities[i] - yMean);
        denominator += (i - xMean) * (i - xMean);
      }
      slope = denominator !== 0 ? numerator / denominator : 0;

      if (slope > avgMonthly * 0.05) trend = 'increasing';
      else if (slope < -avgMonthly * 0.05) trend = 'decreasing';
      else trend = 'stable';
    }

    // Project next 3 months
    const lastMonth = history[history.length - 1].month;
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date(lastMonth + '-01');
      date.setMonth(date.getMonth() + i);
      const monthStr = date.toISOString().slice(0, 7);
      const lastVal = quantities[quantities.length - 1];
      const predicted = Math.max(0, Math.round(lastVal + slope * i));
      forecast.push({ month: monthStr, predicted_quantity: predicted });
    }

    res.json({
      history,
      forecast,
      trend,
      avg_monthly: avgMonthly,
    });
  } catch (err) {
    next(err);
  }
}

function getCostOptimization(req, res, next) {
  try {
    // Find items with multiple suppliers at different prices
    const itemsWithMultipleSuppliers = queryAll(`
      SELECT
        i.id as item_id, i.name as item_name,
        isup.supplier_id, s.name as supplier_name,
        isup.unit_price
      FROM items i
      JOIN item_suppliers isup ON isup.item_id = i.id
      JOIN suppliers s ON s.id = isup.supplier_id
      WHERE isup.unit_price IS NOT NULL
      ORDER BY i.id, isup.unit_price ASC
    `);

    // Group by item
    const itemMap = {};
    for (const row of itemsWithMultipleSuppliers) {
      if (!itemMap[row.item_id]) {
        itemMap[row.item_id] = { item_id: row.item_id, item_name: row.item_name, suppliers: [] };
      }
      itemMap[row.item_id].suppliers.push({
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        unit_price: row.unit_price,
      });
    }

    const supplierSwitches = [];
    for (const itemId of Object.keys(itemMap)) {
      const item = itemMap[itemId];
      if (item.suppliers.length < 2) continue;

      const cheapest = item.suppliers[0]; // already sorted by price ASC
      // Check if any recent orders used a more expensive supplier
      const recentOrders = queryAll(`
        SELECT o.supplier_id, s.name as supplier_name, o.unit_price, o.quantity
        FROM orders o
        JOIN suppliers s ON s.id = o.supplier_id
        WHERE o.item_id = ? AND o.status != 'Cancelled' AND o.unit_price > ?
        ORDER BY o.created_at DESC LIMIT 5
      `, [Number(itemId), cheapest.unit_price]);

      for (const order of recentOrders) {
        const savings = Math.round((order.unit_price - cheapest.unit_price) * order.quantity * 100) / 100;
        if (savings > 0) {
          supplierSwitches.push({
            item_id: item.item_id,
            item_name: item.item_name,
            current_supplier: order.supplier_name,
            current_price: order.unit_price,
            recommended_supplier: cheapest.supplier_name,
            recommended_price: cheapest.unit_price,
            quantity: order.quantity,
            potential_savings: savings,
          });
        }
      }
    }

    // Find bulk order opportunities - same item ordered multiple times in 30-day windows
    const bulkOpportunities = queryAll(`
      SELECT
        i.id as item_id, i.name as item_name,
        COUNT(*) as order_count,
        SUM(o.quantity) as total_quantity,
        AVG(o.unit_price) as avg_price
      FROM orders o
      JOIN items i ON i.id = o.item_id
      WHERE o.status != 'Cancelled'
        AND o.order_date >= date('now', '-60 days')
      GROUP BY o.item_id
      HAVING COUNT(*) >= 2
      ORDER BY order_count DESC
    `);

    const bulk = bulkOpportunities.map(b => ({
      item_id: b.item_id,
      item_name: b.item_name,
      order_count: b.order_count,
      total_quantity: b.total_quantity,
      avg_price: Math.round(b.avg_price * 100) / 100,
      suggested_bulk_order: Math.round(b.total_quantity * 1.1), // suggest 10% more for buffer
      estimated_savings: Math.round(b.total_quantity * b.avg_price * 0.05 * 100) / 100, // assume 5% bulk discount
    }));

    res.json({
      supplier_switches: supplierSwitches,
      bulk_opportunities: bulk,
      total_potential_savings: Math.round(
        (supplierSwitches.reduce((s, x) => s + x.potential_savings, 0) +
         bulk.reduce((s, x) => s + x.estimated_savings, 0)) * 100
      ) / 100,
    });
  } catch (err) {
    next(err);
  }
}

function getProjectRisk(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(projectId)]);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Get BOM items
    const bomItems = queryAll(`
      SELECT bl.item_id, bl.quantity, i.name as item_name
      FROM bom_lines bl
      JOIN items i ON i.id = bl.item_id
      WHERE bl.project_id = ?
    `, [Number(projectId)]);

    // Get project orders
    const orders = queryAll(`
      SELECT o.*, s.name as supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON s.id = o.supplier_id
      WHERE o.project_id = ?
    `, [Number(projectId)]);

    const totalBomItems = bomItems.length;
    const orderedItemIds = new Set(orders.filter(o => o.status !== 'Cancelled').map(o => o.item_id));
    const deliveredItemIds = new Set(orders.filter(o => o.status === 'Delivered').map(o => o.item_id));
    const overdueOrders = orders.filter(o =>
      o.expected_date && o.status !== 'Delivered' && o.status !== 'Cancelled' &&
      o.expected_date < new Date().toISOString().slice(0, 10)
    );

    const pctOrdered = totalBomItems > 0 ? Math.round((orderedItemIds.size / totalBomItems) * 100) : 100;
    const pctDelivered = totalBomItems > 0 ? Math.round((deliveredItemIds.size / totalBomItems) * 100) : 100;

    // Timeline pressure: days until target vs items remaining
    let timelinePressure = 0;
    if (project.target_date) {
      const daysLeft = Math.max(0, Math.round((new Date(project.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const itemsRemaining = totalBomItems - deliveredItemIds.size;
      if (daysLeft < 30 && itemsRemaining > 0) timelinePressure = 30;
      else if (daysLeft < 60 && itemsRemaining > 0) timelinePressure = 15;
    }

    // Calculate risk factors
    const factors = [];
    const unorderedCount = totalBomItems - orderedItemIds.size;
    if (unorderedCount > 0) {
      const impact = unorderedCount > 3 ? 'High' : unorderedCount > 1 ? 'Medium' : 'Low';
      factors.push({
        factor: 'Unordered Items',
        impact,
        detail: `${unorderedCount} of ${totalBomItems} BOM items have not been ordered yet`,
      });
    }

    if (overdueOrders.length > 0) {
      const impact = overdueOrders.length > 2 ? 'High' : 'Medium';
      factors.push({
        factor: 'Overdue Orders',
        impact,
        detail: `${overdueOrders.length} order(s) are past their expected delivery date`,
      });
    }

    // Check supplier reliability
    const supplierIds = [...new Set(orders.map(o => o.supplier_id).filter(Boolean))];
    for (const suppId of supplierIds) {
      const suppOrders = orders.filter(o => o.supplier_id === suppId);
      const suppOverdue = suppOrders.filter(o =>
        o.expected_date && o.status !== 'Delivered' && o.status !== 'Cancelled' &&
        o.expected_date < new Date().toISOString().slice(0, 10)
      );
      if (suppOverdue.length > 1) {
        const suppName = suppOrders[0].supplier_name || `Supplier #${suppId}`;
        factors.push({
          factor: 'Unreliable Supplier',
          impact: 'Medium',
          detail: `${suppName} has ${suppOverdue.length} overdue orders for this project`,
        });
      }
    }

    if (timelinePressure > 0) {
      factors.push({
        factor: 'Timeline Pressure',
        impact: timelinePressure >= 30 ? 'High' : 'Medium',
        detail: `Target date is approaching with ${totalBomItems - deliveredItemIds.size} items still pending delivery`,
      });
    }

    // Calculate risk score 0-100
    let riskScore = 0;
    riskScore += Math.round((1 - pctOrdered / 100) * 30); // up to 30 for unordered
    riskScore += Math.round((1 - pctDelivered / 100) * 20); // up to 20 for undelivered
    riskScore += Math.min(30, overdueOrders.length * 10); // up to 30 for overdue
    riskScore += timelinePressure; // up to 30 for timeline

    riskScore = Math.min(100, riskScore);

    let riskLevel = 'Low';
    if (riskScore >= 75) riskLevel = 'Critical';
    else if (riskScore >= 50) riskLevel = 'High';
    else if (riskScore >= 25) riskLevel = 'Medium';

    // Generate recommendations
    const recommendations = [];
    if (unorderedCount > 0) {
      recommendations.push(`Place orders for the ${unorderedCount} remaining BOM item(s) to avoid delays`);
    }
    if (overdueOrders.length > 0) {
      recommendations.push(`Follow up on ${overdueOrders.length} overdue order(s) immediately`);
    }
    if (timelinePressure >= 30) {
      recommendations.push('Consider expedited shipping for pending items given the approaching deadline');
    }
    if (pctDelivered < 50 && totalBomItems > 0) {
      recommendations.push('Less than half of required materials have been delivered - escalate procurement');
    }
    if (recommendations.length === 0) {
      recommendations.push('Project procurement is on track. Continue monitoring delivery schedules.');
    }

    res.json({
      project_id: Number(projectId),
      project_name: project.name,
      risk_score: riskScore,
      risk_level: riskLevel,
      pct_ordered: pctOrdered,
      pct_delivered: pctDelivered,
      overdue_orders: overdueOrders.length,
      factors,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
}

function getAutoCategorize(req, res, next) {
  try {
    const uncategorized = queryAll(`
      SELECT id, name, description FROM items
      WHERE category IS NULL OR category = ''
    `);

    const categoryKeywords = {
      Electrical: ['cable', 'wire', 'switch', 'panel', 'mcb', 'led', 'lamp', 'transformer', 'breaker', 'fuse', 'socket', 'conduit', 'electrical', 'voltage', 'ampere', 'circuit'],
      Mechanical: ['steel', 'beam', 'bolt', 'nut', 'weld', 'bearing', 'gear', 'shaft', 'flange', 'gasket', 'valve', 'pump', 'motor', 'mechanical', 'metal', 'iron', 'aluminum'],
      Civil: ['cement', 'concrete', 'brick', 'sand', 'gravel', 'tile', 'plaster', 'rebar', 'foundation', 'aggregate', 'block', 'mason'],
      Piping: ['pipe', 'fitting', 'elbow', 'tee', 'reducer', 'coupling', 'pvc', 'copper', 'hose', 'plumbing', 'drain', 'tap'],
      Safety: ['helmet', 'glove', 'goggles', 'harness', 'vest', 'safety', 'fire', 'extinguisher', 'mask', 'boot', 'ppe', 'first aid'],
      General: [],
    };

    const suggestions = uncategorized.map(item => {
      const text = ((item.name || '') + ' ' + (item.description || '')).toLowerCase();
      let bestCategory = 'General';
      let bestScore = 0;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (category === 'General') continue;
        let matchCount = 0;
        for (const keyword of keywords) {
          if (text.includes(keyword)) matchCount++;
        }
        if (matchCount > bestScore) {
          bestScore = matchCount;
          bestCategory = category;
        }
      }

      const confidence = bestScore === 0 ? 0.2 : Math.min(0.95, 0.4 + bestScore * 0.2);

      return {
        item_id: item.id,
        item_name: item.name,
        current_description: item.description,
        suggested_category: bestCategory,
        confidence: Math.round(confidence * 100) / 100,
      };
    });

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

function getSmartSearch(req, res, next) {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query) {
      return res.json({ results: [], parsed: {} });
    }

    // Parse intent
    const statusWords = {
      overdue: "o.expected_date < date('now') AND o.status NOT IN ('Delivered','Cancelled')",
      pending: "o.status = 'Pending'",
      ordered: "o.status = 'Ordered'",
      shipped: "o.status = 'Shipped'",
      delivered: "o.status = 'Delivered'",
      cancelled: "o.status = 'Cancelled'",
    };

    const entityTypes = ['orders', 'items', 'suppliers', 'projects'];
    let detectedStatus = null;
    let detectedEntity = null;
    const searchTerms = [];

    for (const word of query.split(/\s+/)) {
      if (statusWords[word]) {
        detectedStatus = word;
      } else if (entityTypes.includes(word)) {
        detectedEntity = word;
      } else {
        searchTerms.push(word);
      }
    }

    const fuzzyTerm = searchTerms.join(' ');
    const likeTerm = `%${fuzzyTerm}%`;
    const results = {};

    // Search orders
    if (!detectedEntity || detectedEntity === 'orders') {
      let orderSql = `
        SELECT o.id, o.status, o.quantity, o.unit_price, o.expected_date,
               i.name as item_name, s.name as supplier_name, p.name as project_name
        FROM orders o
        LEFT JOIN items i ON i.id = o.item_id
        LEFT JOIN suppliers s ON s.id = o.supplier_id
        LEFT JOIN projects p ON p.id = o.project_id
        WHERE 1=1
      `;
      const params = [];

      if (detectedStatus) {
        orderSql += ` AND ${statusWords[detectedStatus]}`;
      }
      if (fuzzyTerm) {
        orderSql += ` AND (i.name LIKE ? OR s.name LIKE ? OR p.name LIKE ? OR o.notes LIKE ?)`;
        params.push(likeTerm, likeTerm, likeTerm, likeTerm);
      }
      orderSql += ' ORDER BY o.created_at DESC LIMIT 20';

      results.orders = queryAll(orderSql, params);
    }

    // Search items
    if (!detectedEntity || detectedEntity === 'items') {
      if (fuzzyTerm) {
        results.items = queryAll(`
          SELECT id, name, description, category, unit
          FROM items WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
          LIMIT 20
        `, [likeTerm, likeTerm, likeTerm]);
      }
    }

    // Search suppliers
    if (!detectedEntity || detectedEntity === 'suppliers') {
      if (fuzzyTerm) {
        results.suppliers = queryAll(`
          SELECT id, name, contact_email, contact_phone
          FROM suppliers WHERE name LIKE ? OR contact_email LIKE ?
          LIMIT 20
        `, [likeTerm, likeTerm]);
      }
    }

    // Search projects
    if (!detectedEntity || detectedEntity === 'projects') {
      if (fuzzyTerm) {
        results.projects = queryAll(`
          SELECT id, name, status, client_name
          FROM projects WHERE name LIKE ? OR client_name LIKE ? OR description LIKE ?
          LIMIT 20
        `, [likeTerm, likeTerm, likeTerm]);
      }
    }

    res.json({
      results,
      parsed: {
        status: detectedStatus,
        entity: detectedEntity,
        search_terms: searchTerms,
      },
    });
  } catch (err) {
    next(err);
  }
}

function getDashboardInsights(req, res, next) {
  try {
    const insights = [];

    // Overdue orders insight
    const overdueOrders = queryAll(`
      SELECT o.id, s.name as supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON s.id = o.supplier_id
      WHERE o.expected_date < date('now')
        AND o.status NOT IN ('Delivered', 'Cancelled')
    `);

    if (overdueOrders.length > 0) {
      // Group by supplier
      const bySupplier = {};
      for (const o of overdueOrders) {
        const name = o.supplier_name || 'Unknown';
        bySupplier[name] = (bySupplier[name] || 0) + 1;
      }
      const topSupplier = Object.entries(bySupplier).sort((a, b) => b[1] - a[1])[0];
      let desc = `${overdueOrders.length} order(s) are overdue`;
      if (topSupplier && topSupplier[1] > 1) {
        desc += `, ${topSupplier[1]} from ${topSupplier[0]} - consider following up`;
      }
      insights.push({
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Overdue Orders',
        description: desc,
      });
    }

    // Project readiness
    const activeProjects = queryAll(`SELECT id, name FROM projects WHERE status = 'Active'`);
    for (const proj of activeProjects) {
      const bomCount = queryOne(`SELECT COUNT(*) as cnt FROM bom_lines WHERE project_id = ?`, [proj.id]);
      const deliveredCount = queryOne(`
        SELECT COUNT(DISTINCT o.item_id) as cnt
        FROM orders o
        JOIN bom_lines bl ON bl.project_id = ? AND bl.item_id = o.item_id
        WHERE o.project_id = ? AND o.status = 'Delivered'
      `, [proj.id, proj.id]);

      const total = bomCount?.cnt || 0;
      const delivered = deliveredCount?.cnt || 0;
      if (total > 0) {
        const pct = Math.round((delivered / total) * 100);
        const pendingCritical = total - delivered;
        if (pct >= 70 && pendingCritical > 0) {
          insights.push({
            type: 'info',
            icon: 'FolderKanban',
            title: `Project: ${proj.name}`,
            description: `${pct}% materials delivered but ${pendingCritical} item(s) still pending`,
          });
        }
      }
    }

    // Best supplier
    const bestSupplier = queryOne(`
      SELECT s.name, COUNT(*) as total,
        SUM(CASE WHEN o.delivered_date <= o.expected_date THEN 1 ELSE 0 END) as on_time
      FROM orders o
      JOIN suppliers s ON s.id = o.supplier_id
      WHERE o.status = 'Delivered' AND o.delivered_date IS NOT NULL AND o.expected_date IS NOT NULL
      GROUP BY o.supplier_id
      HAVING total >= 3
      ORDER BY (CAST(on_time AS REAL) / total) DESC
      LIMIT 1
    `);

    if (bestSupplier) {
      const pct = Math.round((bestSupplier.on_time / bestSupplier.total) * 100);
      insights.push({
        type: 'success',
        icon: 'TrendingUp',
        title: 'Top Supplier',
        description: `${bestSupplier.name} has the best on-time delivery rate at ${pct}% (${bestSupplier.total} orders)`,
      });
    }

    // Monthly spend comparison
    const thisMonth = queryOne(`
      SELECT COALESCE(SUM(quantity * unit_price), 0) as total
      FROM orders
      WHERE order_date >= date('now', 'start of month')
        AND status != 'Cancelled'
    `);
    const lastMonth = queryOne(`
      SELECT COALESCE(SUM(quantity * unit_price), 0) as total
      FROM orders
      WHERE order_date >= date('now', 'start of month', '-1 month')
        AND order_date < date('now', 'start of month')
        AND status != 'Cancelled'
    `);

    const thisTotal = thisMonth?.total || 0;
    const lastTotal = lastMonth?.total || 0;
    if (thisTotal > 0 || lastTotal > 0) {
      let changeText = '';
      if (lastTotal > 0) {
        const changePct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
        changeText = changePct >= 0 ? `, up ${changePct}% from last month` : `, down ${Math.abs(changePct)}% from last month`;
      }
      insights.push({
        type: 'info',
        icon: 'DollarSign',
        title: 'Monthly Spend',
        description: `Total procurement spend this month: $${thisTotal.toLocaleString()}${changeText}`,
      });
    }

    // Pending orders count
    const pendingCount = queryOne(`SELECT COUNT(*) as cnt FROM orders WHERE status = 'Pending'`);
    if (pendingCount && pendingCount.cnt > 5) {
      insights.push({
        type: 'warning',
        icon: 'Clock',
        title: 'Pending Backlog',
        description: `${pendingCount.cnt} orders are still in Pending status and need to be processed`,
      });
    }

    // If no insights generated, add a positive one
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: 'CheckCircle',
        title: 'All Clear',
        description: 'No issues detected. Procurement operations are running smoothly.',
      });
    }

    res.json({ insights });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSupplierRecommendations,
  getDemandForecast,
  getCostOptimization,
  getProjectRisk,
  getAutoCategorize,
  getSmartSearch,
  getDashboardInsights,
};
