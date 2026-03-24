const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getSummary, getRecentOrders, getProjectReadiness } = require('../controllers/dashboard.controller');

const router = Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/recent-orders', getRecentOrders);
router.get('/project-readiness', getProjectReadiness);

module.exports = router;
