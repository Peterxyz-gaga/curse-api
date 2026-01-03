const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Cấu hình tải Chrome
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

    // Chạy thử 1 người đầu tiên để test lỗi
    const rawName = userList[0];
    const username = decodeURIComponent(rawName).trim();
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

    console.log(`Đang tải: ${url}`);
    
    // Tăng thời gian chờ lên 15 giây (vì lần đầu phải tải Chrome về)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

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

    results.push({ name: username, xp: xp, message: "Thành công!" });

  } catch (error) {
    console.error("Lỗi Browser:", error);
    // QUAN TRỌNG: In lỗi ra màn hình để đọc
    return res.status(500).json({ 
        error: "Lỗi Trình Duyệt", 
        details: error.message,
        stack: error.toString() 
    });
  } finally {
    if (browser) await browser.close();
  }

  res.status(200).json(results);
};
