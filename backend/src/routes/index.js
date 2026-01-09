const express = require('express');
const transferController = require('../controllers/transferController');

const router = express.Router();

// Transfer routes
router.post('/transfer/send', transferController.send);
router.post('/transfer/claim', transferController.claim);
router.post('/transfer/estimate', transferController.estimate);
router.get('/transfer/recipient/:identifier', transferController.getByRecipient);
router.get('/transfer/:claimToken', transferController.getByClaimToken);
router.get('/transfer/sender/:address', transferController.getBySender);
router.get('/transfer/stats', transferController.getStats);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ChainDrop API'
  });
});

module.exports = router;