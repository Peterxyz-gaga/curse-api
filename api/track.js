const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json([]);

  const userList = users.split(',');
  const results = [];

  for (const user of userList) {
    const username = decodeURIComponent(user).trim();
    try {
        const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;
        
        // Gọi thẳng vào trang web (Giả danh là trình duyệt Chrome để không bị chặn)
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
            },
            timeout: 5000 // Tự ngắt nếu web game quá lag
        });

        // Dùng Cheerio đọc HTML (giống jQuery)
        const $ = cheerio.load(data);
        let xp = 0;

        // Quét các dòng trong bảng
        $('tr').each((i, el) => {
            const rowText = $(el).text();
            if (rowText.includes('Overall')) {
                const tds = $(el).find('td');
                // Cột XP thường nằm ở ô thứ 3 hoặc 4
                const xpText = $(tds).eq(3).text() || $(tds).eq(2).text() || '0';
                xp = parseInt(xpText.replace(/,/g, '')) || 0;
            }
        });

        results.push({ name: username, xp: xp, found: xp > 0 });

    } catch (e) {
        console.error(`Lỗi user ${username}:`, e.message);
        results.push({ name: username, xp: 0, found: false });
    }
  }

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
  res.status(200).json(results);
};
