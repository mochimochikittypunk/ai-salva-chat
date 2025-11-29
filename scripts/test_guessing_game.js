const fs = require('fs');
const path = require('path');

async function testGuessingGame() {
    const url = 'http://localhost:3000/api/chat';
    const message = {
        message: "おすすめのコーヒー教えて",
        history: []
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response:", data.response);

        if (data.response.includes("当ててみせましょう") || data.response.includes("好みのコーヒーを")) {
            console.log("SUCCESS: Guessing game triggered.");
        } else {
            console.log("WARNING: Guessing game might not have triggered. Check the response.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testGuessingGame();
