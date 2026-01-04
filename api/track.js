const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json([]);

  const userList = users.split(',');
  const results = [];

  for (const user of userList) {
    const username = decodeURIComponent(user).trim();
    // Đường dẫn vào bảng điểm cá nhân
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

    try {
        // Dùng 'fetch' có sẵn của Node 20 (nhẹ và sạch hơn axios)
        // GIẢ DANH GOOGLE BOT để trang web không chặn và không chuyển hướng
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Referer': 'https://www.google.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        const html = await response.text();
        const $ = cheerio.load(html);
        let maxXp = 0;
        
        // Lấy tiêu đề để debug (nếu cần)
        const pageTitle = $('title').text();

        // THUẬT TOÁN VÉT CẠN: Tìm con số lớn nhất trong các ô bảng (td)
        // Vì XP luôn là số to nhất (vài trăm triệu), to hơn Level (120) hay Rank (5000)
        $('td').each((i, el) => {
            // Xóa dấu phẩy và khoảng trắng
            const text = $(el).text().replace(/,/g, '').trim();
            const num = parseInt(text);

            // Chỉ lấy số lớn hơn 100.000 (Chắc chắn là XP)
            if (!isNaN(num) && num > 100000) {
                if (num > maxXp) maxXp = num;
            }
        });

        results.push({ 
            name: username, 
            xp: maxXp, 
            found: maxXp > 0,
            // Nếu vẫn 0 thì in ra tiêu đề trang web để biết tại sao
            debug: maxXp === 0 ? `Tiêu đề trang: ${pageTitle}` : "OK"
        });

    } catch (e) {
        results.push({ name: username, xp: 0, found: false, debug: e.message });
    }
  }

  // Không lưu cache để luôn có số mới
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json(results);
};
