const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
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
router.patch('/', updateOrganization);
router.get('/subscription', getSubscription);
router.post('/api-keys', generateApiKey);
router.get('/api-keys', listApiKeys);
router.delete('/api-keys/:id', revokeApiKey);
router.get('/webhooks', listWebhooks);
router.post('/webhooks', createWebhook);
router.delete('/webhooks/:id', deleteWebhook);

module.exports = router;
