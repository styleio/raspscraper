const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.get('/scrape', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'No URL provided' });
    }

    try {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: false, // ヘッドフルモードにする
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

        let status;
        // 最初のレスポンスのステータスコードを取得する
        page.on('response', response => {
            if (!status) {  // 初回のレスポンスのみ取得
                status = response.status();
            }
        });

        await page.goto(url);

        // ページのタイトルを取得
        const title = await page.title();
        // ページのbodyを取得
        const body = await page.evaluate(() => document.body.innerHTML);

        await browser.close();

        // title, body, statusをレスポンスとして返す
        res.json({ status,title, body});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
