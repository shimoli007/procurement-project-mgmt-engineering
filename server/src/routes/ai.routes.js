const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getSupplierRecommendations,
  getDemandForecast,
  getCostOptimization,
  getProjectRisk,
  getAutoCategorize,
  getSmartSearch,
  getDashboardInsights,
} = require('../controllers/ai.controller');

const router = Router();

router.use(authenticate);

router.get('/supplier-recommendations/:itemId', getSupplierRecommendations);
router.get('/demand-forecast/:itemId', getDemandForecast);
router.get('/cost-optimization', getCostOptimization);
router.get('/project-risk/:projectId', getProjectRisk);
router.get('/auto-categorize', getAutoCategorize);
router.get('/smart-search', getSmartSearch);
router.get('/dashboard-insights', getDashboardInsights);

module.exports = router;
