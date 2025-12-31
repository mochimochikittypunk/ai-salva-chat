
const fs = require('fs');
const path = require('path');

function getApiKey() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
        if (match) {
            let key = match[1].trim();
            if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                key = key.slice(1, -1);
            }
            return key;
        }
    } catch (e) {
        console.error("Could not read .env.local", e);
    }
    return process.env.GOOGLE_API_KEY;
}

async function runTests() {
    console.log("Checking gemini-pro-latest with EMPTY tools...");

    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${apiKey}`;

    // Test with empty tools array
    const payload = {
        contents: [{ role: "user", parts: [{ text: "こんにちは" }] }],
        tools: [], // Empty tools array
        generationConfig: { temperature: 0.1 }
    };

    console.log("Testing Payload with tools: []");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const txt = await response.text();
            console.error(`ERROR ${response.status}: ${txt}`);
        } else {
            const data = await response.json();
            console.log("SUCCESS with empty tools");
            console.log("Response:", JSON.stringify(data.candidates?.[0]?.content?.parts, null, 2));
        }
    } catch (e) {
        console.error("EXCEPTION:", e);
    }
}

runTests();
