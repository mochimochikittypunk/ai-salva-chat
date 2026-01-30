const fs = require('fs');
const path = require('path');

// Mock next/server
const NextResponse = {
    json: (data, options) => ({ data, options, message: "This is a mock response" })
};

// Mock process.cwd and environmental variables
process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || (() => {
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
        const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
        return match ? match[1].trim() : "MOCK_KEY";
    } catch {
        return "MOCK_KEY";
    }
})();

// We can't easily import the route because it's an ES module and we are in CommonJS land often for scripts,
// OR if we use .mjs it might work but Next.js specific imports might fail.
// So let's extract the PROMPT from the file content effectively.

async function verify() {
    const routePath = path.join(__dirname, '../src/app/api/chat/route.js');
    const content = fs.readFileSync(routePath, 'utf8');

    // Extract BASE_SYSTEM_PROMPT
    // It starts with `const BASE_SYSTEM_PROMPT = \`` and ends with `\`;`
    // We just want to check if the new text is in there.
    const expectedText1 = "追跡番号の確認案内";
    const expectedText2 = "ステータス別の対応案内";

    if (content.includes(expectedText1) && content.includes(expectedText2)) {
        console.log("SUCCESS: System prompt contains the delivery instructions.");
    } else {
        console.error("FAILURE: System prompt does NOT contain the delivery instructions.");
        process.exit(1);
    }

    // Now let's try to actually CALL the API to see if it works? 
    // Since we can't easily run the app, let's just make a direct call using the logic similar to the app
    // but just copying the prompt part.

    // We'll parse the file to get the full prompt text roughly
    const startMarker = 'const BASE_SYSTEM_PROMPT = `';
    const endMarker = '`;';

    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        console.error("Could not find start of prompt");
        return;
    }

    // Find the end marker AFTER the start marker
    const promptStart = startIndex + startMarker.length;
    // We need to find the matching backtick. This is tricky with nested template literals but the file seems simple enough.
    // Actually, let's just use the fact that we know we inserted it.

    // Let's manually construct a minimal test that sends the prompt header + our new section to Gemini
    // to see if it generates the right response.

    // Extract everything from "あなたは「AIサルバさん」です。" up to the new section end.
    // Ideally we want the WHOLE prompt.
    // Let's just grab the whole file content and extract the string.

    let extractedPrompt = "";
    let insidePrompt = false;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('const BASE_SYSTEM_PROMPT = `')) {
            insidePrompt = true;
            continue; // Skip the declaration line part
        }
        if (insidePrompt) {
            if (line.trim() === '`;') {
                insidePrompt = false;
                break;
            }
            extractedPrompt += line + "\n";
        }
    }

    console.log("Extracted Prompt Length:", extractedPrompt.length);

    // Call Gemini
    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = "gemini-2.5-flash"; // Confirmed working
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const userMessage = "サブスクがまだ届かないんですけど、どうなってますか？";

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: extractedPrompt + "\n\nUser: " + userMessage }]
            }
        ]
    };

    console.log("Sending request to Gemini...");
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
            const responseText = data.candidates[0].content.parts[0].text;
            console.log("\n--- AI Response ---");
            console.log(responseText);
            console.log("-------------------");

            if (responseText.includes("発送完了メール") || responseText.includes("追跡") || responseText.includes("郵便局")) {
                console.log("SUCCESS: Response contains expected keywords.");
            } else {
                console.warn("WARNING: Response might not contain expected keywords. Check output manually.");
            }
        } else {
            console.error("No candidates returned", data);
        }
    } catch (e) {
        console.error("Error calling Gemini:", e);
    }

}

verify();
