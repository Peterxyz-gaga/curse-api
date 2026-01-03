const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Khởi động trình duyệt Chrome v123
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Giả lập User Agent mới nhất
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // Chạy vòng lặp quét từng người
    for (const rawName of userList) {
      const username = decodeURIComponent(rawName).trim();
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

      try {
        // Vào trang và chờ load (6 giây)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });

        const xp = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          for (const row of rows) {
            if (row.innerText.includes('Overall')) {
              const cells = row.querySelectorAll('td');
              // Lấy cột 4 hoặc 3
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
    console.error("Lỗi khởi động Browser:", error);
    // Trả về rỗng thay vì báo lỗi server để web không bị sập
    return res.status(200).json([]); 
  } finally {
    if (browser) await browser.close();
  }

  // Sắp xếp kết quả
  results.sort((a, b) => b.xp - a.xp);
  res.status(200).json(results);
};
