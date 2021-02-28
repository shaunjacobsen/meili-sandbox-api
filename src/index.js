require('dotenv').config();
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
const port = 5005;

app.use(morgan());

const EMOJI = ['😋', '👍', '😍'];

const RECOMMMENDING_USER = {
  id: 1,
  username: 'testuser',
  first_name: 'Test User',
  image_url: 'https://meili-assets.s3.eu-central-1.amazonaws.com/users/1.png',
};

app.get('/search', async (req, res) => {
  const { query, lat, lng } = req.query;
  const fsqURL = new URL('https://api.foursquare.com/v2/venues/search');
  fsqURL.searchParams.append('client_id', process.env.FOURSQUARE_CLIENT_ID);
  fsqURL.searchParams.append(
    'client_secret',
    process.env.FOURSQUARE_CLIENT_SECRET,
  );
  fsqURL.searchParams.append('v', '20210228');
  fsqURL.searchParams.append('query', query);
  fsqURL.searchParams.append('ll', `${lat},${lng}`);

  try {
    const fsqResp = await axios.get(fsqURL.toString().replace('%2C', ','));
    const data = fsqResp.data.response.venues;
    const formattedData = data.map((venue, idx) => {
      return {
        id: venue.id,
        name: venue.name,
        pretty_address: `${venue.location?.address}, ${venue.location?.city}`,
        distance: venue.location?.distance,
        coordinates: {
          latitude: venue.location?.lat,
          longitude: venue.location?.lng,
        },
        // randomize these values for now as we don't have any of this ready yet
        is_saved: idx % 2 ? true : false,
        // randomize these values for now as we don't have any of this ready yet
        emoji: idx % 3 ? [EMOJI[Math.floor(Math.random() * EMOJI.length)]] : [],
        community_recommendations: {},
        // randomize these values for now as we don't have any of this ready yet
        recommending_users: idx % 4 ? [] : [RECOMMMENDING_USER],
      };
    });
    return res.json(formattedData);
  } catch (e) {
    return res.status(400).json(e.message);
  }
});

app.listen(port, () => {
  console.log(`🚀 We're up on ${port}`);
});
