const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function verify() {
    console.log("Starting Google Sheets verification (v3 - GoogleAuth)...");

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Handle escaped newlines if present
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
        console.log("❌ Aborting due to missing credentials.");
        return;
    }

    console.log(`Target Spreadsheet ID: ${spreadsheetId}`);
    console.log(`Service Account: ${serviceAccountEmail}`);

    try {
        // Construct a credentials object to pass to GoogleAuth
        // This mimics loading from a JSON file directly
        const credentials = {
            client_email: serviceAccountEmail,
            private_key: privateKey,
        };

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Get the authenticated client
        const client = await auth.getClient();
        console.log("✅ Auth client created successfully.");

        const sheets = google.sheets({ version: 'v4', auth: client });

        // Try to read first
        console.log("Attempting to READ from シート1!A1...");
        await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'シート1!A1',
        });
        console.log("✅ Read permission confirmed.");

        // Try to write
        console.log("Attempting to WRITE to シート1...");
        const timestamp = new Date().toLocaleString();
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'シート1!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    'VERIFICATION_TEST_V3',
                    timestamp,
                    'Connection Successful',
                    'GoogleAuth method worked with シート1.'
                ]],
            },
        });

        console.log("✅ Write permission confirmed. Test row added.");
        console.log("🎉 Google Sheets integration is working correctly!");

    } catch (error) {
        console.error("❌ Connection failed!");
        console.error("Error details:", error.message);

        // Check for common errors
        if (error.message.includes('unregistered callers')) {
            console.error("\n⚠️  CRITICAL ERROR: 'unregistered callers'");
            console.error("This usually means the API is not enabled, BUT you confirmed it is.");
            console.error("Possibility 1: The Service Account is from a DIFFERENT project than the one where API is enabled.");
            console.error("Possibility 2: There is a delay in Google Cloud settings propagation (can take few minutes).");
        }
    }
}

verify();
