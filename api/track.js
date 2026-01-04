const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json([]);

  const userList = users.split(',');
  const results = [];

  for (const user of userList) {
    const username = decodeURIComponent(user).trim();
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);
        let maxXp = 0;

        // CÁCH MỚI: QUÉT TẤT CẢ CÁC Ô TRÊN TRANG WEB
        $('td, div, span, p').each((i, el) => {
            // Lấy nội dung, xóa dấu phẩy
            const text = $(el).text().replace(/,/g, '').trim();
            // Thử chuyển thành số
            const num = parseInt(text);

            // Logic: XP chắc chắn là số lớn (trên 100.000)
            // Level chỉ ~120, Rank chỉ ~5000 -> Nên số nào to > 100k chắc chắn là XP
            if (!isNaN(num) && num > 100000) {
                if (num > maxXp) {
                    maxXp = num;
                }
            }
        });

        results.push({ 
            name: username, 
            xp: maxXp, 
            found: maxXp > 0
        });

    } catch (e) {
        console.error(`Lỗi ${username}:`, e.message);
        results.push({ name: username, xp: 0, found: false });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(results);
};
