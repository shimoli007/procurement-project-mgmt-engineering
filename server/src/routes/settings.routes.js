const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getAllSettings,
  getSetting,
  updateSetting,
  bulkUpdateSettings,
} = require('../controllers/settings.controller');

const router = Router();

router.use(authenticate);

router.get('/', getAllSettings);
router.get('/:key', getSetting);
router.put('/:key', requireRole('CEO', 'Procurement'), updateSetting);
router.post('/bulk', requireRole('CEO', 'Procurement'), bulkUpdateSettings);

module.exports = router;
