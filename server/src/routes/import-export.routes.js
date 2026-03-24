const { Router } = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const {
  exportItems, exportSuppliers, exportOrders, exportProjects,
  exportProjectBom, exportProjectMaterialList,
  importItems, importSuppliers, importOrders,
} = require('../controllers/import-export.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Import routes
router.post('/import/items', upload.single('file'), importItems);
router.post('/import/suppliers', upload.single('file'), importSuppliers);
router.post('/import/orders', upload.single('file'), importOrders);

// Export routes
router.get('/export/items', exportItems);
router.get('/export/suppliers', exportSuppliers);
router.get('/export/orders', exportOrders);
router.get('/export/projects', exportProjects);
router.get('/export/project/:id/bom', exportProjectBom);
router.get('/export/project/:id/material-list', exportProjectMaterialList);

module.exports = router;
