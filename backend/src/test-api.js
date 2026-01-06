const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing ChainDrop API\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log('');

    // 2. Estimate counterfactual address
    console.log('2️⃣ Testing address estimation...');
    const estimate = await axios.post(`${API_URL}/transfer/estimate`, {
      recipientIdentifier: 'test@chaindrop.io',
      senderAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' // Example address
    });
    console.log('✅ Estimate:', estimate.data);
    console.log('   Counterfactual address:', estimate.data.data.counterfactualAddress);
    console.log('');

    // 3. Send transfer (with small amount)
    console.log('3️⃣ Testing transfer creation...');
    const transfer = await axios.post(`${API_URL}/transfer/send`, {
      senderAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      recipientIdentifier: 'alice@chaindrop.io',
      identifierType: 'email',
      amount: '0.001', // 0.001 ETH
      tokenAddress: null // ETH
    });
    console.log('✅ Transfer created!');
    console.log('   Transfer ID:', transfer.data.data.transferId);
    console.log('   Claim Link:', transfer.data.data.claimLink);
    console.log('   TX Hash:', transfer.data.data.txHash);
    console.log('');

    const claimToken = transfer.data.data.claimToken;

    // 4. Get transfer details
    console.log('4️⃣ Testing get transfer...');
    const getTransfer = await axios.get(`${API_URL}/transfer/${claimToken}`);
    console.log('✅ Transfer details:', getTransfer.data.data);
    console.log('');

    // 5. Get stats
    console.log('5️⃣ Testing stats...');
    const stats = await axios.get(`${API_URL}/transfer/stats`);
    console.log('✅ Stats:', stats.data.data);
    console.log('');

    console.log('🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPI();