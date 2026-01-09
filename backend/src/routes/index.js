const express = require('express');
const transferController = require('../controllers/transferController');
const agentController = require('../controllers/agentController');

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
router.get('/agent/stats', agentController.getStats);
router.get('/agent/list', agentController.list);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ChainDrop API'
  });
});

module.exports = router;