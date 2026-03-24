const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { ordersSummary, projectSummary, procurementStatus, supplierPerformance } = require('../controllers/reports.controller');

const router = Router();

router.use(authenticate);

router.get('/orders-summary', ordersSummary);
router.get('/project/:id/summary', projectSummary);
router.get('/procurement-status', procurementStatus);
router.get('/supplier-performance', supplierPerformance);

module.exports = router;
