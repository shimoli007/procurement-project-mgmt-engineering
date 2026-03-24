const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listOrders, getOrder, createOrder, updateOrder, changeOrderStatus } = require('../controllers/orders.controller');

const orderSchema = {
  body: {
    item_id: { required: true, type: 'number' },
    quantity: { required: true, type: 'number', min: 0.01 },
  },
};

const router = Router();

router.use(authenticate);

router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', validate(orderSchema), createOrder);
router.patch('/:id', updateOrder);
router.patch('/:id/status', changeOrderStatus);

module.exports = router;
