const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  bulkUpdateOrderStatus, bulkAssignOrders, bulkDeleteOrders,
  bulkDeleteItems, bulkUpdateItemCategory,
} = require('../controllers/bulk.controller');

const router = Router();

router.use(authenticate);

router.post('/orders/status', requireRole('CEO', 'Procurement'), bulkUpdateOrderStatus);
router.post('/orders/assign', requireRole('CEO', 'Procurement'), bulkAssignOrders);
router.delete('/orders', requireRole('CEO'), bulkDeleteOrders);
router.delete('/items', requireRole('CEO'), bulkDeleteItems);
router.post('/items/category', requireRole('CEO', 'Procurement'), bulkUpdateItemCategory);

module.exports = router;
