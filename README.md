# Spotify Analyzer

Full-stack app to explore ~81k Spotify tracks: filters, popularity vs audio-feature correlations, artist profiles.

## Stack
Python (Pandas, NumPy) for cleaning and stats, SQLite, Node + Express API, React (Vite) frontend.

## Run it
Needs Node 20.19+ (or 22).

Backend (http://localhost:3000):

    cd backend
    npm install
    node src/index.js

Frontend (http://localhost:5173):

    cd frontend
    npm install
    npm run dev

## API
- GET /health : status and total track count
- GET /tracks?genre=pop&minPopularity=70&minEnergy=0.5&maxEnergy=0.9&page=1&limit=20 : filtered, paginated tracks
- GET /correlations : correlation of each audio feature with popularity
- GET /artist/:name : artist profile (averages, top 5 tracks, genre mix)

CORS is enabled, so the frontend can call the API directly.

## Rebuild the data (optional)
Download the Kaggle "Spotify Tracks Dataset" (maharshipandya) to data/raw/dataset.csv, then:

    pip install pandas numpy
    python python/clean.py
    python database/load_db.py
    python python/correlations.py