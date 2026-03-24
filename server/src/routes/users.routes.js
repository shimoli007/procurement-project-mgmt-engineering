const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listUsers, createUser, updateUser, resetPassword, deactivateUser } = require('../controllers/users.controller');

const router = Router();

router.use(authenticate);

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.post('/:id/reset-password', resetPassword);
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;
