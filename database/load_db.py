import sqlite3
import pandas as pd

# 1. Clean CSV load
df = pd.read_csv("data/processed/tracks.csv")

# 2. Database se connect (file nahi hogi toh khud ban jayegi)
conn = sqlite3.connect("database/spotify.db")

# 3. DataFrame ko "tracks" table bana ke daalo
df.to_sql("tracks", conn, if_exists="replace", index=False)

# 4. Indexes: filters ko tez karne ke liye
conn.execute("CREATE INDEX IF NOT EXISTS idx_genre ON tracks(track_genre)")
conn.execute("CREATE INDEX IF NOT EXISTS idx_popularity ON tracks(popularity)")
conn.execute("CREATE INDEX IF NOT EXISTS idx_artists ON tracks(artists)")
conn.commit()

# 5. Check: kitni rows gayi
print(pd.read_sql("SELECT COUNT(*) AS total FROM tracks", conn))

conn.close()