import sqlite3
import pandas as pd

conn = sqlite3.connect("database/spotify.db")

query = """
SELECT track_name, artists, popularity
FROM tracks
WHERE track_genre = 'pop'
ORDER BY popularity DESC
LIMIT 5
"""

print(pd.read_sql(query, conn))
conn.close()