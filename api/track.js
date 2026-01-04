// Thay LINK_CUA_BAN bằng cái link script dài ngoằng bạn vừa gửi
const SHEET_API = "https://script.google.com/macros/s/AKfycbxDkr1MsGOyP7jo568ev78AAGAQAFRyRCriv0si6-Ztg6Fxcx24yAhdR90D8DX3rPVtzQ/exec";

module.exports = async (req, res) => {
  try {
    // Gọi sang Google Sheets để lấy dữ liệu
    const response = await fetch(SHEET_API);
    const data = await response.json();
    
    // Code lọc user (để web clan hiển thị đúng người cần tìm)
    const { users } = req.query;
    if (users) {
        const requestedUsers = users.split(',').map(u => decodeURIComponent(u).trim().toLowerCase());
        // Chỉ trả về những người có trong danh sách yêu cầu
        const filtered = data.filter(d => d.name && requestedUsers.includes(d.name.toLowerCase()));
        return res.status(200).json(filtered);
    }

    // Nếu không hỏi cụ thể ai thì trả về hết
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi kết nối Google Sheet" });
  }
};
