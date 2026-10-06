const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());

const dbPath = path.join(__dirname, "../../database/spotify.db");
const db = new Database(dbPath, { readonly: true });

// Health check
app.get("/health", (req, res) => {
  const row = db.prepare("SELECT COUNT(*) AS total FROM tracks").get();
  res.json({ status: "ok", total: row.total });
});

// Tracks with filters + pagination
app.get("/tracks", (req, res) => {
  const { genre, minPopularity, minEnergy, maxEnergy } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  // Filters ko dynamic jodte hain (sirf jo URL mein aaye)
  const where = [];
  const params = [];

  if (genre) {
    where.push("track_genre = ?");
    params.push(genre);
  }
  if (minPopularity) {
    where.push("popularity >= ?");
    params.push(Number(minPopularity));
  }
  if (minEnergy) {
    where.push("energy >= ?");
    params.push(Number(minEnergy));
  }
  if (maxEnergy) {
    where.push("energy <= ?");
    params.push(Number(maxEnergy));
  }

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  const sql = `
    SELECT track_name, artists, popularity, energy, danceability, tempo, track_genre
    FROM tracks
    ${whereSql}
    ORDER BY popularity DESC
    LIMIT ? OFFSET ?
  `;

  const tracks = db.prepare(sql).all(...params, limit, offset);
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM tracks ${whereSql}`)
    .get(...params);

  res.json({ page, limit, total, tracks });
});

app.get("/correlations", (req, res) => {
  const file = path.join(__dirname, "../../database/correlations.json");
  res.json(JSON.parse(fs.readFileSync(file, "utf-8")));
});

app.listen(3000, () => console.log("Server on http://localhost:3000"));