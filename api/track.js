const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json({ message: "Vui lòng nhập tên người chơi" });

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // Cấu hình Chrome tối ưu cho Vercel
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Test thử với người đầu tiên trong danh sách để xem có chạy không
    // (Chạy 1 người cho nhanh, tránh timeout)
    const targetUser = decodeURIComponent(userList[0]).trim();
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(targetUser)}`;
    
    // Ghi lại quá trình để báo lỗi
    console.log(`Đang truy cập: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

    const xp = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if (row.innerText.includes('Overall')) {
          const cells = row.querySelectorAll('td');
          let text = cells[3]?.innerText || cells[2]?.innerText || '0';
          return text; // Lấy text gốc để kiểm tra
        }
      }
      return "Không tìm thấy dòng Overall"; 
    });

    results.push({ 
        name: targetUser, 
        xp_raw: xp, 
        message: "Đã truy cập thành công!" 
    });

  } catch (error) {
    // ĐÂY LÀ PHẦN QUAN TRỌNG: In lỗi ra màn hình
    console.error(error);
    return res.status(500).json({
        status: "Lỗi nghiêm trọng",
        message: error.message,
        stack: error.stack
    });
  } finally {
    if (browser) await browser.close();
  }

  res.status(200).json(results);
};
