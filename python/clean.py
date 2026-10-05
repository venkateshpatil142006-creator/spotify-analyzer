import pandas as pd

# 1. Load
df = pd.read_csv("data/raw/dataset.csv")
print("Start:", df.shape)

# 2. Extra index column hatao
df = df.drop(columns=["Unnamed: 0"])
print("After drop column:", df.shape)

# 3. Null rows hatao (artists, album_name, track_name mein 1-1 the)
df = df.dropna()
print("After dropna:", df.shape)

# 4. Duplicate track_id hatao (ek track kai genres mein repeat hota hai)
df = df.drop_duplicates(subset=["track_id"], keep="first")
print("After dedupe:", df.shape)

# 5. Save
df.to_csv("data/processed/tracks.csv", index=False)
print("Saved to data/processed/tracks.csv")