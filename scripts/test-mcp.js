import fetch from 'node-fetch';

const MCP_URL = 'https://vps.supabase.siges-app.com.br/mcp?read_only=true';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.uoZmIwX1qDupZjDMh1ylT6LHmQJdFDqHW5vk0iivsKI';

async function testMCP() {
    try {
        console.log('Testing MCP endpoint...');
        const response = await fetch(MCP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {}
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 500));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testMCP();