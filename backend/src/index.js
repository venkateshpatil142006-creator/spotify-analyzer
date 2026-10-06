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

// Correlations (Python ne precompute kiye)
app.get("/correlations", (req, res) => {
  const file = path.join(__dirname, "../../database/correlations.json");
  res.json(JSON.parse(fs.readFileSync(file, "utf-8")));
});

// Artist profile
app.get("/artist/:name", (req, res) => {
  const like = `%;${req.params.name};%`;
  const where = "(';' || artists || ';') LIKE ?";

  const stats = db.prepare(`
    SELECT COUNT(*) AS track_count,
           ROUND(AVG(popularity), 1) AS avg_popularity,
           ROUND(AVG(energy), 3) AS avg_energy,
           ROUND(AVG(danceability), 3) AS avg_danceability,
           ROUND(AVG(valence), 3) AS avg_valence,
           ROUND(AVG(acousticness), 3) AS avg_acousticness,
           ROUND(AVG(tempo), 1) AS avg_tempo
    FROM tracks WHERE ${where}
  `).get(like);

  if (!stats.track_count) {
    return res.status(404).json({ error: "Artist not found" });
  }

  const topTracks = db.prepare(`
    SELECT track_name, popularity, track_genre FROM tracks
    WHERE ${where} ORDER BY popularity DESC LIMIT 5
  `).all(like);

  const genres = db.prepare(`
    SELECT track_genre, COUNT(*) AS count FROM tracks
    WHERE ${where} GROUP BY track_genre ORDER BY count DESC
  `).all(like);

  res.json({ artist: req.params.name, ...stats, topTracks, genres });
});

app.listen(3000, (err) => {
  if (err) {
    console.error("Could not start server:", err.message);
    process.exit(1);
  }
  console.log("Server on http://localhost:3000");
});