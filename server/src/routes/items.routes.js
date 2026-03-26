const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listItems, getItem, createItem, updateItem, deleteItem,
  getItemSuppliers, addItemSupplier, removeItemSupplier,
} = require('../controllers/items.controller');

const itemSchema = {
  body: {
    name: { required: true, type: 'string', min: 1 },
    item_code: { required: false, type: 'string' },
    unit: { required: true, type: 'string' },
    category: { required: false, type: 'string' },
  },
};

const itemUpdateSchema = {
  body: {
    name: { required: false, type: 'string', min: 1 },
    item_code: { required: false, type: 'string' },
    unit: { required: false, type: 'string' },
    category: { required: false, type: 'string' },
  },
};

const router = Router();

router.use(authenticate);

router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', validate(itemSchema), createItem);
router.patch('/:id', validate(itemUpdateSchema), updateItem);
router.delete('/:id', deleteItem);
router.get('/:id/suppliers', getItemSuppliers);
router.post('/:id/suppliers', addItemSupplier);
router.delete('/:id/suppliers/:supplierId', removeItemSupplier);

module.exports = router;
