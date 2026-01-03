const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
  const { users } = req.query;
  if (!users) return res.status(200).json([]);

  const userList = users.split(',');
  const results = [];

  await Promise.all(userList.map(async (rawName) => {
    const username = decodeURIComponent(rawName).trim(); 
    
    try {
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
           let xpText = tds.eq(3).text().trim(); 
           if (!xpText.match(/^\d/)) xpText = tds.eq(2).text().trim();

           xp = parseInt(xpText.replace(/,/g, '')) || 0;
           found = true;
        }
      });

      results.push({ name: username, xp: xp, found: found });

    } catch (error) {
      console.error(`Error: ${username}`);
      results.push({ name: username, xp: 0, found: false });
    }
  }));

  res.status(200).json(results);
}
