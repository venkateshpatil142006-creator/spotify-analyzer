import json
import numpy as np
import pandas as pd

df = pd.read_csv("data/processed/tracks.csv")

features = [
    "danceability", "energy", "loudness", "valence", "acousticness",
    "tempo", "speechiness", "instrumentalness", "liveness",
]

result = {}
for f in features:
    r = np.corrcoef(df[f], df["popularity"])[0, 1]
    result[f] = round(float(r), 4)

with open("database/correlations.json", "w") as fp:
    json.dump(result, fp, indent=2)

print(result)