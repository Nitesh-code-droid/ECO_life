import type { VercelRequest, VercelResponse } from '@vercel/node';

function mapProduct(name?: string) {
    const p = (name || '').toLowerCase();
    const map: Record<string, any> = {
        apple: { emission_factor: { activity_id: 'food_apple' }, parameters: { mass: 0.2, mass_unit: 'kg' } },
        banana: { emission_factor: { activity_id: 'food_banana' }, parameters: { mass: 0.2, mass_unit: 'kg' } },
        beef: { emission_factor: { activity_id: 'food_beef' }, parameters: { mass: 0.15, mass_unit: 'kg' } },
        'plastic bottle': { emission_factor: { activity_id: 'plastic_pet_bottle' }, parameters: { mass: 0.03, mass_unit: 'kg' } },
        'electric car': {
            emission_factor: { activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_electric' },
            parameters: { distance: 10, distance_unit: 'km' }
        },
        'led bulb': {
            emission_factor: { activity_id: 'electricity-energy_source_grid_mix', region: 'US' },
            parameters: { energy: 1, energy_unit: 'kWh' }
        },
        'solar panel': {
            emission_factor: { activity_id: 'electricity-energy_source_grid_mix', region: 'US' },
            parameters: { energy: -1, energy_unit: 'kWh' }
        },
        'fast fashion': {
            emission_factor: { activity_id: 'textiles_generic_garment' },
            parameters: { mass: 0.5, mass_unit: 'kg' }
        }
    };
    return map[p] || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const apiKey = process.env.CLIMATIQ_API_KEY;
    if (!apiKey) return res.status(500).send('Missing CLIMATIQ_API_KEY');

    try {
        const { productName, customPayload } = req.body || {};
        const payload = customPayload || mapProduct(productName);
        if (!payload) return res.status(400).json({ error: 'Unsupported productName or missing payload' });

        const climatiqRes = await fetch('https://api.climatiq.io/estimate', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
            raw: data
        });
    } catch (e: any) {
        return res.status(500).json({ error: 'Server error', details: e?.message || String(e) });
    }
}