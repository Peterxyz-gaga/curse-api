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
        // 1. Tải nội dung trang web (Giả danh Chrome Windows để không bị chặn)
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 5000
        });

        // 2. Dùng Cheerio để "soi" HTML
        const $ = cheerio.load(data);
        let xp = 0;
        let found = false;

        // 3. Thuật toán tìm XP chính xác
        $('tr').each((i, el) => {
            const rowText = $(el).text().trim();
            // Tìm dòng có chứa chữ "Overall"
            if (rowText.includes('Overall')) {
                // Lấy tất cả các ô trong dòng đó
                $(el).find('td').each((j, td) => {
                    const text = $(td).text().trim().replace(/,/g, '');
                    // Nếu ô đó là một con số và lớn hơn 1000 (để tránh nhầm với Level)
                    const num = parseInt(text);
                    if (!isNaN(num) && num > 1000) {
                        xp = num; // Đây chính là XP
                        found = true;
                    }
                });
            }
        });

        results.push({ name: username, xp: xp, found: found });

    } catch (e) {
        console.error(`Lỗi user ${username}:`, e.message);
        // Nếu lỗi thì vẫn trả về, nhưng xp = 0
        results.push({ name: username, xp: 0, found: false });
    }
  }

  // Cấu hình Cache để web chạy mượt hơn
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate');
  res.status(200).json(results);
};
