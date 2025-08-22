
    async function loadData() {
      try {
        const res = await fetch("https://www.curseofaros.com/highscores-overall.json?p=2&lw=0");
        if (!res.ok) throw new Error("Network response was not ok: " + res.status);
        const data = await res.json();
        document.getElementById("output").textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        document.getElementById("output").textContent = "Error: " + err.message;
      }
    }

    loadData();
