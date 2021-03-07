require('dotenv').config();
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
const port = 5005;

app.use(morgan());

const EMOJI = ['😋', '👍', '😍'];
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

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
    return res.json({ items: formattedData });
  } catch (e) {
    return res.status(400).json(e.message);
  }
});

function getContextData(context) {
  if (!context) return;
  return context.map((c) => {
    const type = c.id.split('.')[0];
    return {
      type,
      text: c.text,
      short_code: c.short_code,
    };
  });
}

app.get('/localities', async (req, res) => {
  const { query } = req.query;

  const mapboxURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&types=postcode,neighborhood,locality,place,district`;

  try {
    const mapboxResp = await axios.get(mapboxURL);
    const data = mapboxResp.data;
    const features = data.features.map((feature) => {
      return {
        id: feature.id,
        relevance: feature.relevance,
        name: feature.text,
        full_name: feature.place_name,
        bbox: feature.bbox,
        center: { latitude: feature.center[1], longitude: feature.center[0] },
        context: getContextData(feature.context),
      };
    });
    return res.json(features);
  } catch (e) {
    return res.status(400).json(e.message);
  }
});

app.listen(port, () => {
  console.log(`🚀 We're up on ${port}`);
});
