import pandas as pd

df = pd.read_csv("data/raw/dataset.csv")

print(df.shape)           # (rows, columns)
print(df.columns)         # column ke naam
print(df.head())          # pehli 5 rows
print(df.isnull().sum())  # har column mein nulls