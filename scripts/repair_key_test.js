const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

function repairAndTest() {
    console.log("Attempting to repair Private Key...");

    let rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
        console.log("❌ Key is missing");
        return;
    }

    // 1. Strip everything except base64 chars
    // Remove headers, footers, newlines, spaces
    let body = rawKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, ''); // Remove all whitespace (\n, \r, space)

    // 2. Reconstruct PEM
    // Split into 64 char lines
    const chunks = body.match(/.{1,64}/g);
    const repairedKey =
        "-----BEGIN PRIVATE KEY-----\n" +
        chunks.join('\n') +
        "\n-----END PRIVATE KEY-----\n";

    console.log("Repaired Key generated.");

    // 3. Test with Crypto
    try {
        const sign = crypto.createSign('SHA256');
        sign.update('test data');
        sign.sign(repairedKey, 'hex');
        console.log("✅ REPAIRED Key is VALID!");
        console.log("The issue was likely formatting (whitespace or line breaks).");

        // 4. Test with GoogleAuth (Mock)
        // We can't easily mock GoogleAuth here without making a real request, 
        // but if crypto accepts it, GoogleAuth likely will too.

    } catch (error) {
        console.error("❌ Repaired Key is STILL INVALID");
        console.error(`Error: ${error.message}`);
    }
}

repairAndTest();
