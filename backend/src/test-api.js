const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
    console.log('Testing ChainDrop API\n');

    try {
        //1. Health Check
        console.log('Testing health check...');
        const health = await axios.get(`${API_URL}/health`);
        console.log('Health:', health.data);
        console.log('');

        // 2. Estimate counterfactual address
        console.log('2 Testing address estimation...');
        const extimate = await axios.post(``)
    }
}