const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

async function downloadFromIgram(page, igUrl) {
  await page.goto('https://igram.world', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[name="url"]');
  await page.type('input[name="url"]', igUrl, { delay: 50 });
  await page.click('button[type="submit"]');
  await page.waitForSelector('.result-row a', { timeout: 15000 });
  return await page.$eval('.result-row a', el => el.href);
}

async function downloadFromPubler(page, igUrl) {
  await page.goto('https://publer.com/tools/instagram-reel-downloader', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[name="url"]');
  await page.type('input[name="url"]', igUrl, { delay: 50 });
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href^="https://"]', { timeout: 15000 });
  const links = await page.$$eval('a[href^="https://"]', els => els.map(el => el.href));
  return links[0];
}

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('instagram.com')) {
    return res.status(400).json({ error: 'Invalid Instagram URL.' });
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    let downloadLink;
    try {
      downloadLink = await downloadFromIgram(page, url);
      console.log('✅ iGram succeeded');
    } catch {
      console.warn('⚠️ iGram failed — falling back to Publer');
      downloadLink = await downloadFromPubler(page, url);
    }

    if (!downloadLink) throw new Error('No download link found');
    res.json({ success: true, downloadLink });
  } catch (err) {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch download link.' });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 IG downloader running on port ${PORT}`));
