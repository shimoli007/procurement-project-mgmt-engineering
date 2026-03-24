const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getAuditLog } = require('../controllers/audit.controller');

const router = Router();

router.use(authenticate);

router.get('/', getAuditLog);

module.exports = router;
