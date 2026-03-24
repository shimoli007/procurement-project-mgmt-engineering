const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listUsers, createUser, updateUser } = require('../controllers/users.controller');

const router = Router();

router.use(authenticate);

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);

module.exports = router;
