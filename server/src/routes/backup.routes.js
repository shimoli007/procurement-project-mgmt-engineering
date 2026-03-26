const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  exportDatabase,
  restoreDatabase,
  downloadDb,
} = require('../controllers/backup.controller');

const router = Router();

router.use(authenticate);

router.get('/export', requireRole('CEO', 'Procurement'), exportDatabase);
router.post('/restore', requireRole('CEO'), restoreDatabase);
router.get('/download-db', requireRole('CEO'), downloadDb);

module.exports = router;
