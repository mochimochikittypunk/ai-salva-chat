const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function debugSearch() {
    console.log("Debugging Gemini Search Response...");

    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: "スタバのカフェベロナが好きなんだけど、おすすめある？" }]
            }
        ],
        tools: [
            {
                googleSearch: {}
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        console.log("--- Full Response ---");
        console.log(JSON.stringify(data, null, 2));

        if (data.candidates && data.candidates.length > 0) {
            const parts = data.candidates[0].content.parts;
            console.log("\n--- Parts Analysis ---");
            parts.forEach((part, index) => {
                console.log(`Part ${index}:`, Object.keys(part));
                if (part.text) console.log(`  Text: "${part.text.substring(0, 50)}..."`);
                if (part.functionCall) console.log(`  FunctionCall: ${part.functionCall.name}`);
                if (part.executableCode) console.log(`  ExecutableCode found`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

debugSearch();
