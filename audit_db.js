const axios = require('axios');

const API_URL = 'https://day-tracker-93ly.onrender.com/api';

async function auditDatabase(email, password) {
    try {
        console.log(`Logging in as ${email}...`);
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const { token, user } = loginResponse.data.data;
        // Handle both token structures (accessToken or just token)
        const accessToken = token || loginResponse.data.data.accessToken;

        console.log('Login successful!');
        console.log(`User ID: ${user.id}`);

        // Fetch Goals
        console.log('Fetching goals...');
        const goalsResponse = await axios.get(`${API_URL}/goals`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const goals = goalsResponse.data.data;
        console.log(`\nTotal Goals Found: ${goals.length}`);
        goals.forEach(g => {
            console.log(`- [${g.id}] ${g.title} (Synced: ${!g._pendingSync})`);
        });

        // Fetch Sync Status
        console.log('\nChecking Sync Status...');
        const syncStatusResponse = await axios.get(`${API_URL}/sync/status`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log(`Last Sync At: ${syncStatusResponse.data.data.lastSyncAt}`);

    } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node audit_db.js <email> <password>');
    process.exit(1);
}

auditDatabase(args[0], args[1]);
