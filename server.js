// server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/albumInfo', async (req, res) => {
  const { artist, album, favoriteSongs, leastFavoriteSong, number } = req.body;
  const searchTerm = encodeURIComponent(`${artist} ${album}`);
  const apiUrl = `https://itunes.apple.com/search?term=${searchTerm}&entity=album&limit=1`;

  const response = await fetch(apiUrl);
  const data = await response.json();
  console.log(data)

 if (data.resultCount === 0) {
  return res.json({ error: "Album not found." });
}

const albumInfo = data.results[0];

// Fetch tracks for album to calculate runtime
const tracksResponse = await fetch(`https://itunes.apple.com/lookup?id=${albumInfo.collectionId}&entity=song`);
const tracksData = await tracksResponse.json();

if (tracksData.resultCount === 0) {
  return res.json({ error: "No tracks found for album." });
}

// Sum track durations (trackTimeMillis) except the first result which is album info
const trackDurations = tracksData.results
  .slice(1) // skip album info at index 0
  .map(track => track.trackTimeMillis || 0);

const totalMillis = trackDurations.reduce((sum, val) => sum + val, 0);
const runtime = Math.floor(totalMillis / 60000); // convert ms to full minutes
const trackCount = trackDurations.length;

const output =
  `Album of the Day: ${album} - ${artist}
Genre: ${albumInfo.primaryGenreName}
Runtime: ${trackCount} songs - ${runtime} minutes
Favorite Song(s): ${favoriteSongs}
Least Favorite Song: ${leastFavoriteSong}
Number: ${number}
Album Cover: ${albumInfo.artworkUrl100.replace('100x100bb', '600x600bb')}`;

res.json({ output });

});

app.listen(3000, () => console.log('Server running on port 3000'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});