const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { listUsers, createUser, updateUser, resetPassword, deactivateUser } = require('../controllers/users.controller');

const router = Router();

router.use(authenticate);

router.get('/', listUsers);
router.post('/', requireRole('CEO', 'Procurement'), createUser);
router.patch('/:id', requireRole('CEO', 'Procurement'), updateUser);
router.post('/:id/reset-password', requireRole('CEO', 'Procurement'), resetPassword);
router.patch('/:id/deactivate', requireRole('CEO'), deactivateUser);

module.exports = router;
