export default async function handler(req, res) {
  const players = [
    { name: "SuS QuangTong", lockedXP: 1200000 },
    { name: "SuS Dominate", lockedXP: 800000 },
    { name: "SuS TraDaVN", lockedXP: 600000 },
    { name: "SuS Daera", lockedXP: 400000 }
  ];

  try {
    const responses = await Promise.all(
      players.map(async (p) => {
        try {
          const r = await fetch(`https://api.curseofaros.com/players/${encodeURIComponent(p.name)}`);
          const data = await r.json();
          return data;
        } catch (e) {
          console.error("Lỗi fetch:", p.name, e);
          return null;
        }
      })
    );

    const data = players.map((p, i) => {
      const currentXP = responses[i]?.xp ?? 0;
      return {
        name: p.name,
        lockedXP: p.lockedXP,
        currentXP,
        gainedXP: currentXP - p.lockedXP
      };
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi API tổng:", err);
    res.status(500).json({ error: "Không lấy được dữ liệu" });
  }
}
