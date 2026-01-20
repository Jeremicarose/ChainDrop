const express = require('express');
const transferController = require('../controllers/transferController');
const agentController = require('../controllers/agentController');
const aiController = require('../controllers/aiController');
const priceService = require('../services/priceService');

const router = express.Router();

// Transfer routes - specific routes before parameterized routes
router.post('/transfer/send', transferController.send);
router.post('/transfer/claim', transferController.claim);
router.post('/transfer/estimate', transferController.estimate);
router.get('/transfer/stats', transferController.getStats);
router.get('/transfer/recent', transferController.getRecent);
router.get('/transfer/recipient/:identifier', transferController.getByRecipient);
router.get('/transfer/sender/:address', transferController.getBySender);
router.get('/transfer/:claimToken', transferController.getByClaimToken);

// AI Agent routes
router.post('/agent/create', agentController.create);
router.post('/agent/pay', agentController.pay);
router.post('/agent/revoke', agentController.revoke);
router.post('/agent/update-status', agentController.updateStatus);
router.get('/agent/stats', agentController.getStats);
router.get('/agent/list', agentController.list);

// Scheduled Payments routes (Programmable Payments)
router.post('/agent/schedule/create', agentController.createScheduledPayment);
router.get('/agent/schedule/list', agentController.listScheduledPayments);
router.get('/agent/schedule/stats', agentController.getSchedulerStats);
router.get('/agent/schedule/:id', agentController.getScheduledPayment);
router.get('/agent/schedule/:id/history', agentController.getScheduledPaymentHistory);
router.post('/agent/schedule/:id/pause', agentController.pauseScheduledPayment);
router.post('/agent/schedule/:id/resume', agentController.resumeScheduledPayment);
router.post('/agent/schedule/:id/cancel', agentController.cancelScheduledPayment);

// AI routes - Natural language payment parsing (Claude)
router.post('/ai/parse', aiController.parse);
router.post('/ai/execute', aiController.execute);
router.post('/ai/bulk-parse', aiController.bulkParse);
router.post('/ai/chat', aiController.chat);
router.get('/ai/suggestions', aiController.suggestions);

// Crypto.com AI Agent routes (Hackathon compliance)
router.post('/ai/agent/query', aiController.agentQuery);
router.post('/ai/agent/autonomous', aiController.createAutonomousAgent);
router.get('/ai/status', aiController.status);

// Price routes - USD conversion
router.get('/price/cro', async (req, res) => {
  try {
    const price = await priceService.getCroPrice();
    res.json({ success: true, price, currency: 'USD' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/price/convert', async (req, res) => {
  try {
    const { amount, from = 'CRO' } = req.body;
    if (from.toUpperCase() === 'USD') {
      const result = await priceService.parseAmount(`$${amount}`);
      res.json({ success: true, ...result });
    } else {
      const result = await priceService.getDisplayAmount(amount);
      res.json({ success: true, ...result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
router.get('/health', async (req, res) => {
  const croPrice = await priceService.getCroPrice();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ChainDrop API',
    ai: process.env.ANTHROPIC_API_KEY ? 'enabled' : 'fallback',
    croPrice: croPrice
  });
});

module.exports = router;