export default async function handler(req, res) {
  const players = [
    { name: "SuS QuangTong", lockedXP: 1200000 },
    { name: "SuS Dominate", lockedXP: 800000 },
    { name: "SuS TraDaVN", lockedXP: 600000 },
    { name: "SuS Daera", lockedXP: 400000 }
  ];

  try {
    // Gọi API chính thức của Curse of Aros
    const responses = await Promise.all(
      players.map(p =>
        fetch(`https://api.curseofaros.com/players/${encodeURIComponent(p.name)}`)
          .then(r => r.json())
          .catch(() => null)
      )
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

    // Sắp xếp theo Locked XP
    data.sort((a, b) => b.lockedXP - a.lockedXP);

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không lấy được dữ liệu" });
  }
}
