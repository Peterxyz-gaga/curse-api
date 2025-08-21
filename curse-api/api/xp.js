import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  const players = [
    { name: "sus quangtong", displayName: "SuS QuangTong", lockedXP: 1200000 },
    { name: "sus dominate", displayName: "SuS Dominate", lockedXP: 800000 },
    { name: "sus tradavn", displayName: "SuS TraDaVN", lockedXP: 600000 },
    { name: "sus daera", displayName: "SuS Daera", lockedXP: 400000 },
  ];

  try {
    const results = await Promise.all(players.map(async (p) => {
      const url = `https://www.curseofaros.com/highscores-personal?user=${encodeURIComponent(p.name)}`;
      const page = await fetch(url);
      const html = await page.text();
      const dom = new JSDOM(html);

      // tìm cột "Overall"
      const overallRow = [...dom.window.document.querySelectorAll("tr")]
        .find(r => r.textContent.includes("Overall"));

      let currentXP = 0;
      if (overallRow) {
        const tds = overallRow.querySelectorAll("td");
        if (tds.length > 1) {
          currentXP = parseInt(tds[1].textContent.replace(/[^\d]/g, ""), 10);
        }
      }

      return {
        name: p.displayName,
        lockedXP: p.lockedXP,
        currentXP,
        gainedXP: currentXP - p.lockedXP
      };
    }));

    results.sort((a, b) => b.lockedXP - a.lockedXP);
    res.status(200).json(results);

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
