const fs = require('fs');

async function testHallucination() {
    const url = 'http://localhost:3002/api/chat';
    const message = {
        message: "NODEに18時に行くには？",
        history: []
    };

    try {
        console.log("Sending query: " + message.message);
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

    } catch (error) {
        console.error("Error:", error);
    }
}

testHallucination();
