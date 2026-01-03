const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  // Nếu không có user thì trả về rỗng ngay
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // 1. Khởi động trình duyệt Chrome ảo
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    // 2. Mở tab mới
    const page = await browser.newPage();
    
    // Giả làm người dùng thật
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');

    // 3. Duyệt qua từng người trong danh sách
    // Lưu ý: Vercel Free giới hạn 10 giây, nếu danh sách dài quá có thể bị ngắt giữa chừng
    for (const rawName of userList) {
      const username = decodeURIComponent(rawName).trim();
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

      try {
        // Vào trang và chờ trang load xong (tối đa 5 giây mỗi người)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });

        // Chạy code Javascript ngay trên trang đó để lấy XP
        const xp = await page.evaluate(() => {
          // Tìm dòng chứa "Overall"
          const rows = Array.from(document.querySelectorAll('tr'));
          for (const row of rows) {
            if (row.innerText.includes('Overall')) {
              const cells = row.querySelectorAll('td');
              // Lấy cột 4 (hoặc 3)
              let text = cells[3]?.innerText || cells[2]?.innerText || '0';
              // Xóa dấu phẩy và chuyển thành số
              return parseInt(text.replace(/,/g, '')) || 0;
            }
          }
          return 0; 
        });

        results.push({ name: username, xp: xp, found: xp > 0 });

      } catch (e) {
        console.error(`Lỗi tải ${username}: ${e.message}`);
        results.push({ name: username, xp: 0, found: false });
      }
    }

  } catch (error) {
    console.error("Lỗi Browser:", error);
    // Nếu lỗi nặng thì trả về kết quả rỗng thay vì báo lỗi 500
    return res.status(200).json([]);
  } finally {
    // 4. Đóng trình duyệt để giải phóng RAM
    if (browser) {
      await browser.close();
    }
  }

  // Sắp xếp và trả kết quả
  results.sort((a, b) => b.xp - a.xp);
  res.status(200).json(results);
};
