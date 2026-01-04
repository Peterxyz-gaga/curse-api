const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // CẤU HÌNH CHO NODE 20 (Dùng bản Chrome v126 mới nhất)
    // Đây là link tải Chrome dành riêng cho Server đời mới
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v126.0.0/chromium-v126.0.0-pack.tar"
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security", "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Tối ưu tốc độ: Chặn tải ảnh/font
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'script', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Quét từng người
    for (const rawName of userList) {
        const username = decodeURIComponent(rawName).trim();
        const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

        try {
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

            results.push({ name: username, xp: xp, found: true });
        } catch (e) {
            console.error(`Lỗi user ${username}:`, e.message);
            results.push({ name: username, xp: 0, found: false });
        }
    }

  } catch (error) {
    console.error("Lỗi Browser:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }

  res.status(200).json(results);
};
