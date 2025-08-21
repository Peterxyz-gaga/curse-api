// API endpoint để proxy dữ liệu highscores từ curseofaros
export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.curseofaros.com/highscores.html");
    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*"); // Cho phép mọi nguồn gọi
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lấy dữ liệu" });
  }
}
