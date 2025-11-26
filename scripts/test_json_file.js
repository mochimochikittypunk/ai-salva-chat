const fs = require('fs');
const crypto = require('crypto');
const { google } = require('googleapis');

async function testJson() {
    console.log("Testing with JSON file directly...");
    const jsonPath = '/Users/oshibasan/Downloads/ai-salva-chat-d96ffd92b181.json';

    if (!fs.existsSync(jsonPath)) {
        console.error("JSON file not found at " + jsonPath);
        return;
    }

    const content = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(content);

    console.log("Project ID:", credentials.project_id);
    console.log("Client Email:", credentials.client_email);

    const privateKey = credentials.private_key;
    console.log("Private Key Length:", privateKey.length);

    // 1. Test Crypto
    try {
        const sign = crypto.createSign('SHA256');
        sign.update('test data');
        sign.sign(privateKey, 'hex');
        console.log("✅ Crypto Sign: SUCCESS");
    } catch (error) {
        console.error("❌ Crypto Sign: FAILED");
        console.error(error.message);
    }

    // 2. Test Google Auth
    try {
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        console.log("✅ Google Auth Client: SUCCESS");

        // 3. Test API Call
        // Need sheet ID from env or hardcoded
        // I'll try to read env just for sheet ID
        const envPath = require('path').join(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const sheetIdMatch = envContent.match(/GOOGLE_SHEETS_ID=(.*)/);
        const sheetId = sheetIdMatch ? sheetIdMatch[1].trim() : null;

        if (sheetId) {
            console.log("Testing API call to Sheet ID:", sheetId);
            const sheets = google.sheets({ version: 'v4', auth: client });

            // Get spreadsheet metadata to find sheet names
            const meta = await sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            console.log("✅ Spreadsheet Title:", meta.data.properties.title);
            console.log("✅ Available Sheets:", meta.data.sheets.map(s => s.properties.title).join(', '));

            const firstSheetName = meta.data.sheets[0].properties.title;
            console.log(`Testing read from '${firstSheetName}'...`);

            await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${firstSheetName}!A1`,
            });
            console.log("✅ API Read: SUCCESS");
        } else {
            console.log("⚠️ Skipping API call (Sheet ID not found in .env.local)");
        }

    } catch (error) {
        console.error("❌ Google Auth/API: FAILED");
        console.error(error.message);
    }
}

testJson();
