# AI Salva-san Chat デプロイ手順書

このアプリをインターネット上で公開するための手順です。
GitHubとVercel（バーセル）というサービスを使います。どちらも無料で使えます。

## 手順1: GitHubにコードをアップロードする

1.  **GitHubで新しいリポジトリを作成**
    -   [GitHub](https://github.com/) にログインします。
    -   右上の「+」アイコンから「New repository」を選択します。
    -   **Repository name**: `ai-salva-chat` と入力します。
    -   **Public/Private**: どちらでもOKですが、APIキーが含まれていないのでPublicでも大丈夫です（今回は `.env.local` を除外しているので安全です）。
    -   「Create repository」をクリックします。

2.  **コードをプッシュする**
    -   リポジトリ作成後の画面に表示されるコマンドのうち、**「…or push an existing repository from the command line」** の部分を使います。
    -   以下のコマンドをコピーして、この画面のターミナルで実行してください（`YOUR_USERNAME` はあなたのGitHubユーザー名に置き換えてください）：

    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/ai-salva-chat.git
    git branch -M main
    git push -u origin main
    ```

    ※ ユーザー名とパスワード（またはトークン）を求められる場合があります。

## 手順2: Vercelで公開する

1.  **Vercelに登録/ログイン**
    -   [Vercel](https://vercel.com/) にアクセスします。
    -   「Sign Up」をクリックし、「Continue with GitHub」を選択してログインします。

2.  **プロジェクトのインポート**
    -   ダッシュボードの「Add New...」ボタンから「Project」を選択します。
    -   「Import Git Repository」のリストに、先ほど作った `ai-salva-chat` が表示されているはずです。「Import」をクリックします。

3.  **設定とデプロイ**
    -   **Configure Project** 画面が表示されます。
    -   **Environment Variables**（環境変数）という項目を開きます。
    -   ここにAPIキーを設定します：
        -   **Key**: `GOOGLE_API_KEY`
        -   **Value**: あなたのGemini APIキー（`.env.local` にあるものと同じ）
    -   「Add」をクリックして追加します。
    -   最後に下の「Deploy」ボタンをクリックします。

4.  **完了！**
    -   1分ほど待つと、花吹雪が舞ってデプロイが完了します。
    -   表示されたURL（例: `https://ai-salva-chat.vercel.app`）にアクセスすれば、誰でもあなたのアプリを使えるようになります！

## 公開後の更新手順

アプリの内容を修正したい場合は、以下の手順で行います。VercelはGitHubと連携しているため、**GitHubにコードをプッシュするだけで、自動的に本番環境も更新されます。**

1.  **コードを修正する**
    -   VS Codeなどでファイルを編集し、保存します。

2.  **変更をGitHubに送る**
    -   ターミナルで以下の3つのコマンドを順番に実行します：

    ```bash
    git add .
    git commit -m "修正内容のメモ（例：タイトルの変更）"
    git push origin main
    ```

3.  **自動更新を待つ**
    -   `git push` が成功すると、Vercelが自動的に変更を検知して、新しいバージョンのビルドとデプロイを開始します。
    -   通常1〜2分で新しい内容が反映されます。Vercelのダッシュボードで進行状況を確認することもできます。
