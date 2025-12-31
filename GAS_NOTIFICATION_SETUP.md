# チャットログ更新通知の設定手順 (Google Apps Script)

スプレッドシートに新しい会話ログが記録された際、定期的にチェックしてメール通知を送る機能を設定します。
Google Apps Scriptを使用するため、サーバー設定などは不要で、Googleアカウントのみで完結します。

## 手順

### 1. スクリプトエディタを開く
1. 会話ログを保存しているGoogleスプレッドシートを開きます。
2. メニューバーの **「拡張機能」** > **「Apps Script」** をクリックします。

### 2. コードを貼り付ける
1. エディタが開いたら、デフォルトで入っている `function myFunction() {...}` をすべて削除します。
2. 以下のコード（`scripts/gas_notification.js` と同じ内容）をコピーして貼り付けます。

```javascript
function sendDailyChatLogNotification() {
  // 設定: 通知先のメールアドレス (自動取得がエラーになるため、直接入力してください)
  const EMAIL_RECIPIENT = 'your-email@example.com'; 
  
  // 件名
  const SUBJECT = "【AIサルバさん】チャットログ更新通知";
  // シート名（実際のシート名に合わせてください。デフォルトは 'シート1'）
  const SHEET_NAME = 'シート1';
  
  // 対象期間（時間単位）: 12時間前の更新をチェック
  const HOURS_AGO = 12;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // 最後にデータがある行を取得
  const lastRow = sheet.getLastRow();
  
  // データがない場合は終了
  if (lastRow < 2) { 
    return;
  }
  
  // データを取得 (ルートJSの実装: [sessionId, timestamp, summary, history])
  // B列(Column 2)がタイムスタンプと仮定
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 4);
  const data = dataRange.getValues();
  
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - (HOURS_AGO * 60 * 60 * 1000));
  
  let recentLogs = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const timestampStr = row[1]; // B列: タイムスタンプ
    const summary = row[2];      // C列: 要約
    
    // タイムスタンプの解析
    const logTime = new Date(timestampStr);
    
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
```

3. **保存アイコン**（フロッピーディスクのマーク）をクリックし、プロジェクト名に適当な名前（例: `ChatLogNotification`）をつけて保存します。

### 3. トリガー（定期実行）を設定する
1. 左側のメニューから **「トリガー」**（時計のアイコン）をクリックします。
2. 右下の **「+ トリガーを追加」** ボタンをクリックします。
3. 以下の設定を行います：
   - **実行する関数**: `sendDailyChatLogNotification`
   - **実行するデプロイ**: `Head`
   - **イベントのソースを選択**: `時間主導型`
   - **トリガーのタイプを選択**: `時間ベースのタイマー`
   - **時間の間隔を選択**: `12 時間おき`
4. **「保存」** をクリックします。
   - 初回保存時に、Googleアカウントへのアクセス権限（承認）を求められる場合があります。その際は画面の指示に従って許可してください（安全でないページと出た場合は「詳細」→「（プロジェクト名）に移動」を選択）。

### 完了
これで、12時間ごとにスプレッドシートがチェックされ、過去12時間以内に新しいログや更新があれば、あなたのGmailアドレスに要約付きの通知メールが届くようになります。
