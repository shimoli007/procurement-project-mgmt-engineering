const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getOrganization,
  updateOrganization,
  getSubscription,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  listWebhooks,
  createWebhook,
  deleteWebhook,
} = require('../controllers/organizations.controller');

const router = Router();

router.use(authenticate);

router.get('/', getOrganization);
router.patch('/', requireRole('CEO'), updateOrganization);
router.get('/subscription', getSubscription);
router.post('/api-keys', requireRole('CEO'), generateApiKey);
router.get('/api-keys', requireRole('CEO'), listApiKeys);
router.delete('/api-keys/:id', requireRole('CEO'), revokeApiKey);
router.get('/webhooks', requireRole('CEO'), listWebhooks);
router.post('/webhooks', requireRole('CEO'), createWebhook);
router.delete('/webhooks/:id', requireRole('CEO'), deleteWebhook);

module.exports = router;
