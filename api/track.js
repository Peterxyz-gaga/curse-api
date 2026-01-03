const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];

  await Promise.all(userList.map(async (rawName) => {
    const username = decodeURIComponent(rawName).trim();
    
    try {
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;
      
      // GIẢ LẬP TRÌNH DUYỆT THẬT KỸ CÀNG
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.curseofaros.com/',
          'Connection': 'keep-alive'
        },
        timeout: 10000 // Tăng thời gian chờ lên 10s
      });
      
      const $ = cheerio.load(response.data);
      let xp = 0;
      let found = false;

      // Kiểm tra xem có bị chặn bởi Cloudflare không
      const pageTitle = $('title').text();
      console.log(`Kiểm tra ${username} - Tiêu đề trang: ${pageTitle}`);

      $('tr').each((i, el) => {
        const rowText = $(el).text();
        if (rowText.includes('Overall')) {
           const tds = $(el).find('td');
           let xpText = tds.eq(3).text().trim(); 
           if (!xpText.match(/^\d/)) xpText = tds.eq(2).text().trim();

           xp = parseInt(xpText.replace(/,/g, '')) || 0;
           found = true;
        }
      });

      results.push({ name: username, xp: xp, found: found });

    } catch (error) {
      console.error(`Lỗi kết nối ${username}:`, error.message);
      results.push({ name: username, xp: 0, found: false });
    }
  }));

  results.sort((a, b) => b.xp - a.xp);
  res.status(200).json(results);
};
