const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const {
  listItems, getItem, createItem, updateItem, deleteItem,
  getItemSuppliers, addItemSupplier, removeItemSupplier,
} = require('../controllers/items.controller');

const router = Router();

router.use(authenticate);

router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', createItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);
router.get('/:id/suppliers', getItemSuppliers);
router.post('/:id/suppliers', addItemSupplier);
router.delete('/:id/suppliers/:supplierId', removeItemSupplier);

module.exports = router;
