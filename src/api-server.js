const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json()); // JSON形式のPOSTデータを受け取れるようにする

app.post('/scrape', async (req, res) => {

    const { url, operations, headless = false } = req.body;
    console.log('POSTリクエストを受け付けました');

    //整合性チェック
    if (!url) {
        return res.status(400).json({ error: 'URLが指定されていません' });
    }

    
    try {
        console.log('ブラウザの起動中...');
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: headless,
            args: [
                '--no-sandbox',
                '--no-zygote',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process'
            ]
        });
        console.log('ブラウザの起動に成功しました');

        const page = await browser.newPage();
        console.log('ページの作成に成功しました');

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
        console.log('ページの読み込みに成功しました');

        // フォームフィールドに入力する（formFieldsが指定されている場合）
        if (operations && Array.isArray(operations)) {
            for (const field of operations) {
                if (field.selector && field.value) {
                    await page.type(field.selector, field.value); // CSSセレクタでフォーム要素を選択し、値を入力
                    console.log('フォームに「'+field.value+'」入力しました');
                }else if (field.selector && field.click){
                    await page.click(field.selector); // CSSセレクタでボタンをクリック
                    console.log('ボタンをクリックしました');
                }else if (field.selector && field.select){
                    await page.select(field.selector, field.select); // CSSセレクタでセレクトボックスを選択
                    console.log('セレクトボックス「'+field.select+'」を選択しました');
                }else if (field.selector && field.check){
                    await page.check(field.selector); // CSSセレクタでチェックボックスをチェック
                    console.log('チェックボックスをチェックしました');
                }else if (field.selector && field.uncheck){
                    await page.uncheck(field.selector); // CSSセレクタでチェックボックスをアンチェック
                    console.log('チェックボックスをアンチェックしました');
                }else if (field.selector && field.press){
                    await page.keyboard.press(field.press); // キーボードのキーを押す
                    console.log('キー「'+field.press+'」を押しました');
                }else if (field.selector && field.hover){
                    await page.hover(field.selector); // CSSセレクタで要素にホバー
                    console.log('ホバーしました');
                }else if (field.selector && field.focus){
                    await page.focus(field.selector); // CSSセレクタで要素にフォーカス
                    console.log('フォーカスしました');
                }else if (field.selector && field.evaluate){
                    await page.evaluate(field.evaluate); // JavaScriptを実行
                    console.log('JavaScriptを実行しました');
                }else if (field.selector && field.wait){
                    await page.waitForSelector(field.selector); // CSSセレクタが表示されるまで待つ
                    console.log('CSSセレクタが表示されるまで待ちました');
                }else if(field.waitForNavigation){
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // ナビゲーションが完了するまで待つ
                    console.log('ナビゲーションが完了するまで待ちました');
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
        console.log('ブラウザを閉じました');

        // タイトル、ボディ、ステータスコードをレスポンスとして返す
        res.json({ status, currentUrl, title, body });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが http://localhost:${PORT} で稼働中`);
});
