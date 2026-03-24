const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const {
  listProjects, getProject, createProject, updateProject, deleteProject,
  getBom, addBomLine, updateBomLine, deleteBomLine,
  generateOrders, getMaterialList,
} = require('../controllers/projects.controller');

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

router.get('/:id/bom', getBom);
router.post('/:id/bom', addBomLine);
router.patch('/:id/bom/:lineId', updateBomLine);
router.delete('/:id/bom/:lineId', deleteBomLine);

router.post('/:id/generate-orders', generateOrders);
router.get('/:id/material-list', getMaterialList);

module.exports = router;
