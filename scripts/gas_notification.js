function sendDailyChatLogNotification() {
    // 設定: 通知先のメールアドレス (自動取得がエラーになるため、直接入力してください)
    const EMAIL_RECIPIENT = 'your-email@example.com';
    // 件名
    const SUBJECT = "【AIサルバさん】チャットログ更新通知";
    // シート名
    const SHEET_NAME = 'シート1';

    // 対象期間（時間単位）: 12時間前の更新をチェック
    const HOURS_AGO = 12;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 最後にデータがある行を取得
    const lastRow = sheet.getLastRow();

    // データがない場合は終了
    if (lastRow < 2) { // ヘッダーのみの場合も無視
        return;
    }

    // データを取得 (日付はB列にあると仮定、データはA列〜D列まで)
    // route.jsの実装: [sessionId, timestamp, summary, history]
    // B列(Column 2)がタイムスタンプ
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 4);
    const data = dataRange.getValues();

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (HOURS_AGO * 60 * 60 * 1000));

    let recentLogs = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const timestampStr = row[1]; // B列: タイムスタンプ
        const summary = row[2];      // C列: 要約

        // タイムスタンプのパース (YYYY/MM/DD HH:MM:SS 形式を想定)
        const logTime = new Date(timestampStr);

        // パース失敗時やinvalid dateの場合はスキップ（念のため現在時刻と比較して判断）
        if (isNaN(logTime.getTime())) {
            continue;
        }

        // 指定時間より新しい場合、リストに追加
        if (logTime >= cutoffTime) {
            recentLogs.push({
                time: timestampStr,
                summary: summary
            });
        }
    }

    // 新しいログがあればメール送信
    if (recentLogs.length > 0) {
        let body = `過去${HOURS_AGO}時間以内に、${recentLogs.length}件の新しいチャットログ（または更新）がありました。\n\n`;

        recentLogs.forEach((log, index) => {
            body += `--------------------------------------------------\n`;
            body += `[${index + 1}] 日時: ${log.time}\n`;
            body += `要約: ${log.summary}\n`;
        });

        body += `\n--------------------------------------------------\n`;
        body += `スプレッドシートを確認する: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;

        MailApp.sendEmail({
            to: EMAIL_RECIPIENT,
            subject: SUBJECT,
            body: body
        });

        Logger.log("メールを送信しました。件数: " + recentLogs.length);
    } else {
        Logger.log("新しいログはありませんでした。");
    }
}

// 動作確認用
function testNotification() {
    sendDailyChatLogNotification();
}
