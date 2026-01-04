const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Cấu hình cho Chromium v131 trên Node 20
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Fake User-Agent để giống người thật 100%
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Chặn ảnh để load nhanh
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (const user of userList) {
        const username = decodeURIComponent(user).trim();
        const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

        try {
            // Tăng timeout lên 8s để chắc ăn
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

            const xp = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('tr'));
                for (const row of rows) {
                  if (row.innerText.includes('Overall')) {
                    const cells = row.querySelectorAll('td');
                    let text = cells[3]?.innerText || cells[2]?.innerText || '0';
                    return parseInt(text.replace(/,/g, '')) || 0;
                  }
                }
                return 0;
            });

            results.push({ name: username, xp: xp, found: xp > 0 });
        } catch (e) {
            console.error(`Lỗi ${username}:`, e.message);
            results.push({ name: username, xp: 0, found: false });
        }
    }

  } catch (error) {
    console.error("Lỗi System:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }

  res.setHeader('Cache-Control', 'no-store'); // Không lưu cache để luôn có số mới
  res.status(200).json(results);
};
