const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // 1. Nhận danh sách tên từ Web gửi lên
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];
  let browser = null;

  try {
    // 2. Cấu hình Chrome (Bản nhẹ dành cho Server)
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security", "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 3. TỐI ƯU TỐC ĐỘ: Chặn tải Ảnh, Font, CSS, Quảng cáo
    // Việc này giúp tải trang nhanh gấp 5 lần bình thường
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'script', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 4. Bắt đầu quét từng người trong danh sách (Vòng lặp)
    for (const rawName of userList) {
        const username = decodeURIComponent(rawName).trim();
        // Link trang cá nhân của người chơi
        const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

        try {
            // Chỉ đợi tối đa 5 giây cho mỗi người (để tránh bị treo toàn bộ)
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });

            // Đọc dữ liệu trên màn hình
            const xp = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('tr'));
                for (const row of rows) {
                  // Tìm dòng có chữ "Overall"
                  if (row.innerText.includes('Overall')) {
                    const cells = row.querySelectorAll('td');
                    // Cột XP thường nằm ở vị trí số 3 hoặc 2
                    let text = cells[3]?.innerText || cells[2]?.innerText || '0';
                    return parseInt(text.replace(/,/g, '')) || 0;
                  }
                }
                return 0; // Không tìm thấy thì trả về 0
            });

            // Ghi nhận kết quả
            results.push({ name: username, xp: xp, found: true });

        } catch (e) {
            console.error(`Lỗi tải user ${username}:`, e.message);
            // Nếu lỗi thì trả về XP = 0 để web không bị trắng
            results.push({ name: username, xp: 0, found: false });
        }
    }

  } catch (error) {
    console.error("Lỗi Browser:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    // Luôn luôn tắt trình duyệt sau khi dùng xong để giải phóng RAM
    if (browser) await browser.close();
  }

  // Trả danh sách kết quả về cho Web
  res.status(200).json(results);
};
