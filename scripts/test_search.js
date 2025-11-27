const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function testSearch() {
    console.log("Testing Gemini API with Google Search...");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("API Key not found in .env.local");
        return;
    }

    const modelName = "gemini-2.5-flash"; // Same as in route.js
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: "スタバのカフェベロナってどんな味？" }]
            }
        ],
        tools: [
            {
                googleSearchRetrieval: {
                    dynamicRetrievalConfig: {
                        mode: "MODE_DYNAMIC",
                        dynamicThreshold: 0.7
                    }
                }
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);
            return;
        }

        const data = await response.json();
        console.log("API Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testSearch();
