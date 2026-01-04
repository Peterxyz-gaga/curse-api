const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { users } = req.query;
  if (!users) return res.json([]);

  const userList = users.split(',');
  const results = [];

  for (const user of userList) {
    const username = decodeURIComponent(user).trim();
    // Link chuẩn của bảng xếp hạng cá nhân
    const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(username)}`;

    try {
        // GIẢ DANH TRÌNH DUYỆT (QUAN TRỌNG)
        // Thêm đầy đủ thông tin để web game không chặn
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.curseofaros.com/highscores',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            timeout: 8000 // Đợi tối đa 8 giây
        });

        const $ = cheerio.load(data);
        let xp = 0;
        
        // Lấy tiêu đề trang web để kiểm tra xem có bị chặn không
        const pageTitle = $('title').text().trim();

        // THUẬT TOÁN TÌM XP MỚI (Quét kỹ hơn)
        $('tr').each((i, el) => {
            const rowText = $(el).text().trim();
            // Chỉ tìm dòng có chữ Overall
            if (rowText.includes('Overall')) {
                $(el).find('td').each((j, td) => {
                    // Xóa dấu phẩy: 719,832,247 -> 719832247
                    const cleanText = $(td).text().replace(/,/g, '').trim();
                    const num = parseInt(cleanText);
                    
                    // Logic: XP phải là số và lớn hơn 1000 (để né Level 120)
                    if (!isNaN(num) && num > 200) {
                        // Nếu số quá lớn (> 200 triệu) thì chắc chắn là XP, lấy luôn
                        if (num > 1000000) {
                             xp = num;
                             return false; // Dừng tìm kiếm dòng này
                        }
                        // Nếu không thì cứ lưu tạm số lớn nhất tìm được
                        if (num > xp) xp = num;
                    }
                });
            }
        });

        // Gửi thêm thông tin debug để kiểm tra
        results.push({ 
            name: username, 
            xp: xp, 
            found: xp > 0,
            debug: xp === 0 ? `Lỗi: Web trả về tiêu đề "${pageTitle}"` : "OK"
        });

    } catch (e) {
        console.error(`Lỗi user ${username}:`, e.message);
        results.push({ name: username, xp: 0, found: false, debug: e.message });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(results);
};
