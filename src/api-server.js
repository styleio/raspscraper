const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json()); // JSON形式のPOSTデータを受け取れるようにする

app.post('/scrape', async (req, res) => {
    const { url, operations } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URLが指定されていません' });
    }

    try {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: false, // デバッグのためにヘッドフルモード
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ]
        });

        const page = await browser.newPage();

        // セッションを維持するためにユーザーエージェントをセット
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');

        let status;
        // 最初のレスポンスのステータスコードを取得
        page.on('response', response => {
            if (!status) {
                status = response.status();
            }
        });

        // 指定されたURLにアクセス
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // フォームフィールドに入力する（formFieldsが指定されている場合）
        if (operations && Array.isArray(operations)) {
            for (const field of operations) {
                if (field.selector && field.value) {
                    await page.type(field.selector, field.value); // CSSセレクタでフォーム要素を選択し、値を入力
                }else if (field.selector && field.click){
                    await page.click(field.selector); // CSSセレクタでボタンをクリック
                }else if (field.selector && field.select){
                    await page.select(field.selector, field.select); // CSSセレクタでセレクトボックスを選択
                }else if (field.selector && field.check){
                    await page.check(field.selector); // CSSセレクタでチェックボックスをチェック
                }else if (field.selector && field.uncheck){
                    await page.uncheck(field.selector); // CSSセレクタでチェックボックスをアンチェック
                }else if (field.selector && field.press){
                    await page.keyboard.press(field.press); // キーボードのキーを押す
                }else if (field.selector && field.hover){
                    await page.hover(field.selector); // CSSセレクタで要素にホバー
                }else if (field.selector && field.focus){
                    await page.focus(field.selector); // CSSセレクタで要素にフォーカス
                }else if (field.selector && field.evaluate){
                    await page.evaluate(field.evaluate); // JavaScriptを実行
                }else if (field.selector && field.wait){
                    await page.waitForSelector(field.selector); // CSSセレクタが表示されるまで待つ
                }else if(field.waitForNavigation){
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // ナビゲーションが完了するまで待つ
                }
            }
        }

        // タイトルとボディを取得
        const title = await page.title();
        const body = await page.evaluate(() => document.body.innerHTML);

        //リダイレクト先のURLを取得
        const currentUrl = page.url();

        // ブラウザを閉じる
        await browser.close();

        // タイトル、ボディ、ステータスコードをレスポンスとして返す
        res.json({ status, currentUrl, title, body });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが http://localhost:${PORT} で稼働中`);
});
