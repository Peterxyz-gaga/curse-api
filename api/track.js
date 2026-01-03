const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Tải Chrome v123 từ xa (bản dành cho Node 20)
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    for (const rawName of userList) {
      const username = decodeURIComponent(rawName).trim();
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

      try {
        // Tối ưu: Chỉ chờ tối đa 6 giây
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });

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
        console.error(`Lỗi ${username}: ${e.message}`);
        results.push({ name: username, xp: 0, found: false });
      }
    }

  } catch (error) {
    console.error("Lỗi Browser:", error);
    return res.status(200).json([]);
  } finally {
    if (browser) await browser.close();
  }

  results.sort((a, b) => b.xp - a.xp);
  res.status(200).json(results);
};
