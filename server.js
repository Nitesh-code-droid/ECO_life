import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const DEFAULT_DATA_VERSION = '27.27'; // Climatiq selector requires data_version (2025)

app.use(cors());
app.use(express.json());

function mapProduct(name) {
  const p = (name || '').toLowerCase();
  const map = {
    apple: { emission_factor: { activity_id: 'food_apple', data_version: DEFAULT_DATA_VERSION }, parameters: { mass: 0.2, mass_unit: 'kg' } },
    banana: { emission_factor: { activity_id: 'food_banana', data_version: DEFAULT_DATA_VERSION }, parameters: { mass: 0.2, mass_unit: 'kg' } },
    beef: { emission_factor: { activity_id: 'food_beef', data_version: DEFAULT_DATA_VERSION }, parameters: { mass: 0.15, mass_unit: 'kg' } },
    'plastic bottle': { emission_factor: { activity_id: 'plastic_pet_bottle', data_version: DEFAULT_DATA_VERSION }, parameters: { mass: 0.03, mass_unit: 'kg' } },
    'electric car': {
      emission_factor: { activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_electric', data_version: DEFAULT_DATA_VERSION },
      parameters: { distance: 10, distance_unit: 'km' },
    },
    'led bulb': {
      emission_factor: { activity_id: 'electricity-energy_source_grid_mix', region: 'US', data_version: DEFAULT_DATA_VERSION },
      parameters: { energy: 1, energy_unit: 'kWh' },
    },
    'solar panel': {
      emission_factor: { activity_id: 'electricity-energy_source_grid_mix', region: 'US', data_version: DEFAULT_DATA_VERSION },
      parameters: { energy: -1, energy_unit: 'kWh' },
    },
    'fast fashion': {
      emission_factor: { activity_id: 'textiles_generic_garment', data_version: DEFAULT_DATA_VERSION },
      parameters: { mass: 0.5, mass_unit: 'kg' },
    },
  };
  return map[p] || null;
}

app.post('/api/climatiq-estimate', async (req, res) => {
  const apiKey = process.env.CLIMATIQ_API_KEY;
  if (!apiKey) {
    return res.status(500).send('Missing CLIMATIQ_API_KEY');
  }

  try {
    const { productName, customPayload } = req.body || {};
    const payload = customPayload || mapProduct(productName);
    if (!payload) {
      return res.status(400).json({ error: 'Unsupported productName or missing payload' });
    }

    // Ensure data_version when using activity_id selector (2025 requirement)
    if (payload?.emission_factor?.activity_id && !payload.emission_factor.data_version) {
      payload.emission_factor.data_version = DEFAULT_DATA_VERSION;
    }

    // As of 2025, the Climatiq Estimate endpoint remains at this base URL
    const climatiqRes = await fetch('https://api.climatiq.io/estimate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await climatiqRes.json();
    if (!climatiqRes.ok) {
      return res.status(climatiqRes.status).json({ error: data?.message || 'Climatiq error', details: data });
    }

    const co2e = typeof data.co2e === 'number' ? data.co2e : null;
    return res.status(200).json({
      co2e,
      co2e_unit: data.co2e_unit || 'kg',
      isEcoFriendly: co2e !== null ? co2e < 5 : null,
      alternatives: [],
      raw: data,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: e?.message || String(e) });
  }
});

app.options('/api/climatiq-estimate', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});
