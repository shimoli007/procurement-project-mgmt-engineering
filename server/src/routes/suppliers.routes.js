const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/suppliers.controller');

const router = Router();

router.use(authenticate);

router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
