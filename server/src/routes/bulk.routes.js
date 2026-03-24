const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const {
  bulkUpdateOrderStatus, bulkAssignOrders, bulkDeleteOrders,
  bulkDeleteItems, bulkUpdateItemCategory,
} = require('../controllers/bulk.controller');

const router = Router();

router.use(authenticate);

router.post('/orders/status', bulkUpdateOrderStatus);
router.post('/orders/assign', bulkAssignOrders);
router.delete('/orders', bulkDeleteOrders);
router.delete('/items', bulkDeleteItems);
router.post('/items/category', bulkUpdateItemCategory);

module.exports = router;
