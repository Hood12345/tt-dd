const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('tiktok.com')) {
    return res.status(400).json({ error: 'Invalid TikTok URL' });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://snaptik.app', { waitUntil: 'networkidle2' });

    await page.type('input[name="url"]', url);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.waitForSelector('.download-links a', { timeout: 30000 });

    const downloadLink = await page.$eval('.download-links a', el => el.href);

    await browser.close();
    return res.json({ download_url: downloadLink });
  } catch (err) {
    await browser.close();
    return res.status(500).json({
      error: 'Download failed',
      details: err.message
    });
  }
});

app.listen(3000, () => {
  console.log('✅ TikTok Downloader (SnapTik) running on port 3000');
});
