const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { search } = require('../controllers/search.controller');

const router = Router();

router.use(authenticate);

router.get('/', search);

module.exports = router;
