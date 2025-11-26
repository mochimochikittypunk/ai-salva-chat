const fs = require('fs');
const path = require('path');

function fixEnv() {
    const jsonPath = '/Users/oshibasan/Downloads/ai-salva-chat-d96ffd92b181.json';
    const envPath = path.join(__dirname, '../.env.local');

    // 1. Get API Key from existing .env.local (or hardcode if we know it)
    // We saw it in the cat output: AIzaSyDoZcoLMAyuRWRLIQv9q8I9mWKQl2-uTf0
    const apiKey = 'AIzaSyDoZcoLMAyuRWRLIQv9q8I9mWKQl2-uTf0';

    // 2. Read JSON file
    if (!fs.existsSync(jsonPath)) {
        console.error("JSON file not found!");
        return;
    }
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(jsonContent);

    // 3. Construct new .env.local content
    // We use JSON.stringify for the key to ensure it's properly escaped as a string with \n
    const privateKey = JSON.stringify(credentials.private_key);

    const newEnvContent = `GOOGLE_API_KEY=${apiKey}
GOOGLE_SHEETS_ID=1YM_Q32m_R7Tq5Vs1Mw1_RXklnhHhekIDHuBwsdU6NxY
GOOGLE_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}
GOOGLE_PRIVATE_KEY=${privateKey}
`;

    fs.writeFileSync(envPath, newEnvContent);
    console.log("✅ .env.local has been regenerated with correct credentials.");
}

fixEnv();
