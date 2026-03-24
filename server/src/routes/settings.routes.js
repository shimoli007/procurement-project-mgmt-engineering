const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
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
router.put('/:key', updateSetting);
router.post('/bulk', bulkUpdateSettings);

module.exports = router;
