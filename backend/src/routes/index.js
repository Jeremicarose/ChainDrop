const express = require('express');
const transferController = require('../controllers/transferController');
const agentController = require('../controllers/agentController');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Transfer routes
router.post('/transfer/send', transferController.send);
router.post('/transfer/claim', transferController.claim);
router.post('/transfer/estimate', transferController.estimate);
router.get('/transfer/recipient/:identifier', transferController.getByRecipient);
router.get('/transfer/:claimToken', transferController.getByClaimToken);
router.get('/transfer/sender/:address', transferController.getBySender);
router.get('/transfer/stats', transferController.getStats);

// AI Agent routes
router.post('/agent/create', agentController.create);
router.post('/agent/pay', agentController.pay);
router.post('/agent/revoke', agentController.revoke);
router.post('/agent/update-status', agentController.updateStatus);
router.get('/agent/stats', agentController.getStats);
router.get('/agent/list', agentController.list);

// AI routes - Natural language payment parsing
router.post('/ai/parse', aiController.parse);
router.post('/ai/execute', aiController.execute);
router.post('/ai/bulk-parse', aiController.bulkParse);
router.post('/ai/chat', aiController.chat);
router.get('/ai/suggestions', aiController.suggestions);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ChainDrop API',
    ai: process.env.ANTHROPIC_API_KEY ? 'enabled' : 'fallback'
  });
});

module.exports = router;