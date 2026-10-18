import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";

const API = "http://localhost:3000";
const FEATURES = [
  "danceability", "energy", "loudness", "valence", "acousticness",
  "tempo", "speechiness", "instrumentalness", "liveness",
];
const SUGGESTED = ["Harry Styles", "Taylor Swift", "The Weeknd", "Drake", "Billie Eilish"];
const tip = { background: "#12151f", border: "1px solid #262b3a", borderRadius: 10, color: "#e8ecf6" };

const getJSON = (path) => fetch(`${API}${path}`).then((r) => r.json());

function useDebounce(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label className="slider">
      <span>{label}<b>{value}</b></span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Meter({ label, value }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="bar"><i style={{ width: `${value * 100}%` }} /></div>
    </div>
  );
}

function Explore({ onArtist }) {
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState("");
  const [q, setQ] = useState("");
  const [minPop, setMinPop] = useState(0);
  const [minEnergy, setMinEnergy] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(1);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ tracks: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);

  const dq = useDebounce(q);
  const dPop = useDebounce(minPop, 300);
  const dMinE = useDebounce(minEnergy, 300);
  const dMaxE = useDebounce(maxEnergy, 300);

  useEffect(() => {
    getJSON("/genres").then(setGenres).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [genre, dq, dPop, dMinE, dMaxE]);

  useEffect(() => {
    const p = new URLSearchParams({ page, limit: 20 });
    if (genre) p.set("genre", genre);
    if (dq) p.set("q", dq);
    if (dPop > 0) p.set("minPopularity", dPop);
    if (dMinE > 0) p.set("minEnergy", dMinE);
    if (dMaxE < 1) p.set("maxEnergy", dMaxE);
    setLoading(true);
    let cancelled = false;
    getJSON(`/tracks?${p}`)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [page, genre, dq, dPop, dMinE, dMaxE]);

  const totalPages = Math.max(Math.ceil(data.total / data.limit), 1);
  const reset = () => { setGenre(""); setQ(""); setMinPop(0); setMinEnergy(0); setMaxEnergy(1); };
  const go = (n) => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <section>
      <div className="panel filters">
        <input className="search" placeholder="Search track or artist..." value={q}
          onChange={(e) => setQ(e.target.value)} />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.genre} value={g.genre}>{g.genre} ({g.count})</option>
          ))}
        </select>
        <Slider label="Min popularity" value={minPop} min={0} max={100} step={1} onChange={setMinPop} />
        <Slider label="Min energy" value={minEnergy} min={0} max={1} step={0.05} onChange={setMinEnergy} />
        <Slider label="Max energy" value={maxEnergy} min={0} max={1} step={0.05} onChange={setMaxEnergy} />
        <button className="ghost" onClick={reset}>Reset</button>
      </div>

      <div className="count">
        {loading && data.tracks.length === 0 ? "Loading..." : `${data.total.toLocaleString()} tracks found`}
      </div>

      <div className={loading ? "list loading" : "list"}>
        {data.tracks.map((t, i) => (
          <article className="track" key={`${t.track_name}-${t.artists}-${i}`}
            style={{ animationDelay: `${i * 25}ms` }}>
            <div className="rank">{(page - 1) * data.limit + i + 1}</div>
            <div className="info">
              <h3>{t.track_name}</h3>
              <p>
                {t.artists.split(";").map((a, j) => (
                  <button key={j} className="artist-link" onClick={() => onArtist(a)}>{a}</button>
                ))}
              </p>
            </div>
            <span className="chip">{t.track_genre}</span>
            <Meter label="Energy" value={t.energy} />
            <Meter label="Dance" value={t.danceability} />
            <div className="pop"><strong>{t.popularity}</strong><span>popularity</span></div>
          </article>
        ))}
        {!loading && data.tracks.length === 0 && (
          <div className="empty">No tracks match these filters.</div>
        )}
      </div>

      <div className="pager">
        <button disabled={page === 1} onClick={() => go(page - 1)}>← Prev</button>
        <span>Page {page} / {totalPages.toLocaleString()}</span>
        <button disabled={page >= totalPages} onClick={() => go(page + 1)}>Next →</button>
      </div>
    </section>
  );
}

function Insights() {
  const [corr, setCorr] = useState(null);
  const [feature, setFeature] = useState("instrumentalness");
  const [points, setPoints] = useState([]);

  useEffect(() => { getJSON("/correlations").then(setCorr).catch(() => {}); }, []);
  useEffect(() => {
    getJSON(`/scatter?feature=${feature}&limit=800`).then(setPoints).catch(() => {});
  }, [feature]);

  const bars = useMemo(
    () => corr
      ? Object.entries(corr)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      : [],
    [corr]
  );
  const top = bars[0];

  return (
    <section>
      <div className="panel">
        <h3>Correlation with popularity</h3>
        {top && (
          <p className="insight">
            Strongest link: <b>{top.name}</b> ({top.value > 0 ? "+" : ""}{top.value}).
            {Math.abs(top.value) < 0.3 &&
              " That is a weak relationship, so no single audio feature predicts popularity on its own."}
          </p>
        )}
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={bars} layout="vertical" margin={{ left: 30, right: 20 }}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false} />
            <XAxis type="number" stroke="#8b93a7" />
            <YAxis type="category" dataKey="name" stroke="#8b93a7" width={110} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} contentStyle={tip} />
            <Bar dataKey="value" radius={4} cursor="pointer"
              onClick={(d) => setFeature(d.payload?.name ?? d.name)}>
              {bars.map((b) => (
                <Cell key={b.name} fill={b.value >= 0 ? "#1ed760" : "#ff5d73"}
                  opacity={b.name === feature ? 1 : 0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Popularity vs {feature}</h3>
        <div className="pills">
          {FEATURES.map((f) => (
            <button key={f} className={f === feature ? "pill active" : "pill"}
              onClick={() => setFeature(f)}>{f}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" />
            <XAxis type="number" dataKey="x" name={feature} stroke="#8b93a7" domain={["auto", "auto"]} />
            <YAxis type="number" dataKey="y" name="popularity" stroke="#8b93a7" domain={[0, 100]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tip} />
            <Scatter data={points} fill="#1ed760" fillOpacity={0.45} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ArtistPage({ name, setName }) {
  const [input, setInput] = useState(name);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = (n) => {
    const v = n.trim();
    if (!v) return;
    setName(v);
    setInput(v);
    setLoading(true);
    setError("");
    fetch(`${API}/artist/${encodeURIComponent(v)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Not found");
        setProfile(d);
      })
      .catch((e) => { setProfile(null); setError(e.message); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (name) search(name); }, []);

  const radar = profile
    ? [
        { k: "Energy", v: profile.avg_energy },
        { k: "Dance", v: profile.avg_danceability },
        { k: "Valence", v: profile.avg_valence },
        { k: "Acoustic", v: profile.avg_acousticness },
      ]
    : [];
  const maxG = profile ? Math.max(...profile.genres.map((g) => g.count)) : 1;

  return (
    <section>
      <div className="searchrow">
        <input className="search" placeholder="Search an artist, e.g. Taylor Swift" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(input)} />
        <button className="primary" onClick={() => search(input)}>Search</button>
      </div>
      <div className="suggest">
        {SUGGESTED.map((s) => (
          <button key={s} className="pill" onClick={() => search(s)}>{s}</button>
        ))}
      </div>

      {loading && <div className="count">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {profile && !loading && (
        <div>
          <div className="panel hero">
            <div className="avatar">{profile.artist[0].toUpperCase()}</div>
            <div>
              <h2>{profile.artist}</h2>
              <p>{profile.track_count} tracks in the dataset</p>
            </div>
            <div className="bigstat">
              <strong>{profile.avg_popularity}</strong>
              <span>avg popularity</span>
            </div>
          </div>

          <div className="grid2">
            <div className="panel">
              <h3>Sound profile</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radar} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,.12)" />
                  <PolarAngleAxis dataKey="k" tick={{ fill: "#aab2c5", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar dataKey="v" stroke="#1ed760" fill="#1ed760" fillOpacity={0.35} />
                  <Tooltip contentStyle={tip} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="tempo">Avg tempo {profile.avg_tempo} BPM</div>
            </div>

            <div className="panel">
              <h3>Top tracks</h3>
              {profile.topTracks.map((t, i) => (
                <div className="toprow" key={i}>
                  <div>{t.track_name}<br /><span>{t.track_genre}</span></div>
                  <b>{t.popularity}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Genre mix</h3>
            {profile.genres.slice(0, 8).map((g) => (
              <div className="gbar" key={g.track_genre}>
                <span>{g.track_genre}</span>
                <div className="bar"><i style={{ width: `${(g.count / maxG) * 100}%` }} /></div>
                <b>{g.count}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("explore");
  const [artist, setArtist] = useState("");
  const [total, setTotal] = useState(null);

  useEffect(() => {
    getJSON("/health").then((d) => setTotal(d.total)).catch(() => setTotal(-1));
  }, []);

  const openArtist = (name) => { setArtist(name); setTab("artist"); };

  return (
    <div className="app">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <header className="top">
        <div className="brand">
          <div className="logo">♫</div>
          <div>
            <h1>Music Intelligence</h1>
            <p>
              {total > 0
                ? `${total.toLocaleString()} tracks analysed`
                : total === -1 ? "Backend offline, start the server" : "Connecting..."}
            </p>
          </div>
        </div>
        <nav className="tabs">
          {[["explore", "Explore"], ["insights", "Insights"], ["artist", "Artist"]].map(([id, label]) => (
            <button key={id} className={tab === id ? "tab active" : "tab"}
              onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "explore" && <Explore onArtist={openArtist} />}
        {tab === "insights" && <Insights />}
        {tab === "artist" && <ArtistPage name={artist} setName={setArtist} />}
      </main>
    </div>
  );
}