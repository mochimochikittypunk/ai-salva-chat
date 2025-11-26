import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { history, sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // 1. Generate Summary using Gemini
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        const summaryPrompt = `
以下の会話履歴を、3行以内の簡潔な要約にまとめてください。
ユーザーが何に興味を持ち、どのようなアドバイスを受けたかを重点的に記録してください。

会話履歴:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
`;

        const modelName = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: summaryPrompt }] }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error during summary: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "要約の生成に失敗しました";

        // 2. Save to Google Sheets (Upsert Logic)
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
            console.warn("Google Sheets credentials not set. Skipping sheet update.");
            return NextResponse.json({
                success: true,
                summary,
                warning: "Google Sheets credentials missing. Summary generated but not saved."
            });
        }

        // Use GoogleAuth instead of JWT for better compatibility
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });
        const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const rowData = [sessionId, timestamp, summary, JSON.stringify(history)];

        // Check if session exists
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'シート1!A:A', // Read only column A (Session IDs)
        });

        const rows = getRes.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === sessionId);

        if (rowIndex !== -1) {
            // Update existing row (rowIndex is 0-based, Sheets API uses 1-based, so +1)
            const updateRange = `シート1!A${rowIndex + 1}:D${rowIndex + 1}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: updateRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [rowData],
                },
            });
        } else {
            // Append new row
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'シート1!A:D',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [rowData],
                },
            });
        }

        return NextResponse.json({ success: true, summary });

    } catch (error) {
        console.error("Summary API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
