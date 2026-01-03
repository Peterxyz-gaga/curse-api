const axios = require('axios');
const cheerio = require('cheerio');

// Sử dụng module.exports để tránh lỗi Server Error 500
module.exports = async (req, res) => {
  const { users } = req.query;
  
  // Nếu không có users, trả về mảng rỗng ngay
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];

  await Promise.all(userList.map(async (rawName) => {
    const username = decodeURIComponent(rawName).trim(); 
    
    try {
      // QUAN TRỌNG: Dùng dấu huyền ` (nằm dưới phím Esc) để nối chuỗi
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000 
      });
      
      const $ = cheerio.load(response.data);
      let xp = 0;
      let found = false;

      $('tr').each((i, el) => {
        const rowText = $(el).text();
        if (rowText.includes('Overall')) {
           const tds = $(el).find('td');
           // Lấy cột 3 hoặc cột 2 tùy giao diện
           let xpText = tds.eq(3).text().trim(); 
           if (!xpText.match(/^\d/)) xpText = tds.eq(2).text().trim();

           xp = parseInt(xpText.replace(/,/g, '')) || 0;
           found = true;
        }
      });

      results.push({ name: username, xp: xp, found: found });

    } catch (error) {
      console.error(`Lỗi: ${username}`);
      results.push({ name: username, xp: 0, found: false });
    }
  }));

  // Sắp xếp XP từ cao xuống thấp
  results.sort((a, b) => b.xp - a.xp);

  res.status(200).json(results);
};
