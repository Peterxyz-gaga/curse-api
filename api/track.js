const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { users } = req.query;
  // Cho phép chạy test kể cả khi không nhập user (để check chrome)
  const userList = (users || "SuS SadSaiki").split(',');
  const results = [];
  let browser = null;

  try {
    // 1. Cấu hình link tải Chrome (Bản v123.0.1 cho Node 20)
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
    );

    // 2. Khởi động trình duyệt
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // 3. Test thử trang đầu tiên
    const username = decodeURIComponent(userList[0]).trim();
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

    console.log(`Đang truy cập: ${url}`);
    // Tăng thời gian chờ lên 20s (để kịp tải Chrome về)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const xp = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tr'));
        for (const row of rows) {
          if (row.innerText.includes('Overall')) {
            const cells = row.querySelectorAll('td');
            let text = cells[3]?.innerText || cells[2]?.innerText || '0';
            return parseInt(text.replace(/,/g, '')) || 0;
          }
        }
        return "Không tìm thấy Overall";
    });

    results.push({ name: username, xp: xp, status: "Thành công!" });

  } catch (error) {
    console.error("Lỗi:", error);
    // QUAN TRỌNG: Trả về lỗi chi tiết để đọc
    return res.status(200).json({ 
        Loi_Gap_Phai: "Co loi xay ra",
        Noi_Dung: error.message,
        Chi_Tiet: error.toString()
    });
  } finally {
    if (browser) await browser.close();
  }

  res.status(200).json(results);
};
