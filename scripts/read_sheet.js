const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function readSheet() {
    console.log("Reading data from Google Sheets...");

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
        console.log("❌ Missing credentials.");
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'シート1!A:C', // Read Session ID, Timestamp, Summary
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found.');
        } else {
            console.log(`Found ${rows.length} rows:`);
            rows.forEach((row, index) => {
                console.log(`${index + 1}: [${row[1]}] ${row[2]} (Session: ${row[0]})`);
            });
        }

    } catch (error) {
        console.error('The API returned an error: ' + error);
    }
}

readSheet();
