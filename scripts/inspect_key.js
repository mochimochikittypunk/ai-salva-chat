const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

function inspect() {
    console.log("Inspecting Private Key...");

    let rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
        console.log("❌ Key is missing");
        return;
    }

    console.log(`Raw length: ${rawKey.length}`);

    // Check for literal \n
    const hasLiteralSlashN = rawKey.includes('\\n');
    console.log(`Contains literal '\\n': ${hasLiteralSlashN}`);

    // Check for actual newlines
    const hasNewline = rawKey.includes('\n');
    console.log(`Contains actual newline: ${hasNewline}`);

    // Attempt to fix
    let fixedKey = rawKey;
    if (hasLiteralSlashN) {
        console.log("Fixing: Replacing literal '\\n' with actual newlines...");
        fixedKey = fixedKey.replace(/\\n/g, '\n');
    }

    // Check if it looks like a valid PEM
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    if (!fixedKey.includes(header)) console.log("❌ Missing Header");
    if (!fixedKey.includes(footer)) console.log("❌ Missing Footer");

    // Try to sign data to verify validity
    try {
        const sign = crypto.createSign('SHA256');
        sign.update('test data');
        sign.sign(fixedKey, 'hex');
        console.log("✅ Key is VALID (Crypto signature successful)");
    } catch (error) {
        console.error("❌ Key is INVALID for Crypto operations");
        console.error(`Error: ${error.message}`);

        // Dump first few chars to help debug (safe-ish)
        console.log("--- Head of key (first 50 chars) ---");
        console.log(JSON.stringify(fixedKey.substring(0, 50)));
        console.log("------------------------------------");
    }
}

inspect();
