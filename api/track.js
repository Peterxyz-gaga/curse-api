const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // Cấu hình để chạy được trên Vercel (quan trọng)
  chromium.setHeadlessMode = true; 
  chromium.setGraphicsMode = false;

  const { users } = req.query;
  if (!users) return res.json({ message: "Vui lòng nhập tên người chơi" });

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Khởi động trình duyệt với cấu hình mới
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Lấy người đầu tiên để test
    const targetUser = decodeURIComponent(userList[0]).trim();
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(targetUser)}`;
    
    console.log(`Đang truy cập: ${url}`);

    // Tăng thời gian chờ lên 15s cho chắc ăn
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const xp = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if (row.innerText.includes('Overall')) {
          const cells = row.querySelectorAll('td');
          // Thử lấy cột 4 hoặc 3
          let text = cells[3]?.innerText || cells[2]?.innerText || '0';
          return text;
        }
      }
      return "Không tìm thấy"; 
    });

    results.push({ 
        name: targetUser, 
        xp_raw: xp, 
        message: "Thành công!" 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
        status: "Lỗi Server",
        error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }

  res.status(200).json(results);
};
