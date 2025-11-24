const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load API Key from .env.local manually
const envPath = path.join(__dirname, '../.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

console.log(`Testing API with Key: ${apiKey.substring(0, 5)}...`);




async function test() {
    // 1. List Models
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Fetching model list...");

    let models = [];
    try {
        const response = await fetch(listUrl);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        models = data.models || [];
    } catch (e) {
        console.error("Failed to list models:", e.message);
        return;
    }

    console.log(`Found ${models.length} models.`);

    // Filter for generateContent support
    const chatModels = models.filter(m =>
        m.supportedGenerationMethods &&
        m.supportedGenerationMethods.includes('generateContent')
    );

    console.log(`${chatModels.length} models support generateContent.`);

    for (const model of chatModels) {
        const name = model.name.replace('models/', '');
        console.log(`\nTesting ${name}...`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`;
        const body = {
            contents: [{ parts: [{ text: "Hello" }] }]
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                console.log(`>>> SUCCESS with ${name} <<<`);
                const data = await res.json();
                console.log(JSON.stringify(data, null, 2));
                return; // Stop after first success
            } else {
                console.log(`Failed: ${res.status}`);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
    console.log("\nAll models failed.");
}

test();
