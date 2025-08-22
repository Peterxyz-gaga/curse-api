// /api/xp.js
export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.curseofaros.com/highscores-overall.json?p=2&lw=0");
    if (!response.ok) {
      throw new Error("Không lấy được dữ liệu từ Curse of Aros");
    }
    const data = await response.json();

    // lọc ra các người chơi bắt đầu bằng "SuS"
    const lockedXP = {
      "SuS QuangTong": 1000000,
      "SuS Dominate": 2000000,
      "SuS TraDaVN": 1500000,
      "SuS Daera": 1700000,
    };

    const players = data
      .filter(p => p.name && p.name.startsWith("SuS"))
      .map(p => {
        const locked = lockedXP[p.name] || 0;
        return {
          name: p.name,
          lockedXP: locked,
          currentXP: p.xp,
          gainedXP: p.xp - locked,
        };
      });

    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
