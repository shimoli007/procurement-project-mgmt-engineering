const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listOrders, getOrder, createOrder, updateOrder, changeOrderStatus } = require('../controllers/orders.controller');

const router = Router();

router.use(authenticate);

router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id', updateOrder);
router.patch('/:id/status', changeOrderStatus);

module.exports = router;
