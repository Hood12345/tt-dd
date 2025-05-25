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
    await page.goto('https://tiktokdownload.online/', { waitUntil: 'networkidle2' });

    // Type the TikTok URL into the form
    await page.type('#url', url);
    await page.click('button[type="submit"]');

    // Wait for the download link to appear
    await page.waitForSelector('a.download_link.without_watermark', { timeout: 30000 });

    // Extract the download URL
    const downloadLink = await page.$eval('a.download_link.without_watermark', el => el.href);

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
  console.log('✅ TikTok Downloader (TikTokDownload.online) running on port 3000');
});
