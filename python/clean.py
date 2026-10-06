import pandas as pd

# 1. Load
df = pd.read_csv("data/raw/dataset.csv")
print("Start:", df.shape)

# 2. Extra index column hatao
df = df.drop(columns=["Unnamed: 0"])

# 3. Null rows hatao
df = df.dropna()
print("After dropna:", df.shape)

# 4. Sabse popular version upar rakho, taaki keep="first" wahi bachaye
df = df.sort_values("popularity", ascending=False, kind="stable")

# 5. Same track_id hatao (ek track kai genres mein repeat hota hai)
df = df.drop_duplicates(subset=["track_id"], keep="first")
print("After track_id dedupe:", df.shape)

# 6. Same naam + same artist wale alag-alag versions hatao
df = df.drop_duplicates(subset=["track_name", "artists"], keep="first")
print("After name+artist dedupe:", df.shape)

# 7. Save
df.to_csv("data/processed/tracks.csv", index=False)
print("Saved to data/processed/tracks.csv")