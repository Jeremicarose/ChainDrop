const transferService = require('../services/transferService');
const blockchainService = require('.../services/blockchainService');

const transferController = {
    /**
     * POST /api/transfer/send
     * Initiate a new transfer
     */
    async send(req, res) {
        try {
            const {senderAddress, recipientIdentifier, identifierType, amoun, tokenAddress } = req.body;

            // Validation
            if (!senderAddress || !recipientIdentifier || !identifierType || !amount) {
                return res.status(400).json({
                    error: 'Missing require fields',
                    required: ['senderAddress', 'recipientIdentifier', 'identifierType', 'amount']
                });
            }

            // Validate identifier type
            const validTypes = ['email', 'phone', 'social'];
            if (!validTypes.includes(identifierType)) {
                return res.status(400).json({
                    error: 'Invalid identifier type',
                    validTypes
                });
            }
        }
    }
}