import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = "V1Z4DT9E9D3CDDQK3RA6FSQ0TM";
const DATA_VERSION = "27.27";

// Default quantities for each unit type
const defaultValues: Record<string, { value: number; unit: string }> = {
  mass: { value: 1, unit: "kg" },
  distance: { value: 1, unit: "km" },
  volume: { value: 1, unit: "l" },
  energy: { value: 1, unit: "kWh" },
};

// Get alternatives based on product type
function getAlternatives(productName: string): string[] {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('beef') || lowerName.includes('meat')) {
    return ["plant-based proteins", "chicken", "tofu", "lentils"];
  }
  if (lowerName.includes('plastic')) {
    return ["glass containers", "reusable materials", "biodegradable options"];
  }
  if (lowerName.includes('car') || lowerName.includes('vehicle')) {
    return ["public transportation", "bicycle", "electric vehicle"];
  }
  if (lowerName.includes('fashion') || lowerName.includes('clothing')) {
    return ["sustainable brands", "secondhand", "clothing rental"];
  }
  
  return ["eco-friendly alternatives", "sustainable options"];
}

// Detect parameter name from EF unit_type
function getParameterForUnitType(unitType: string) {
  if (unitType.includes("mass")) return "mass";
  if (unitType.includes("distance")) return "distance";
  if (unitType.includes("energy")) return "energy";
  if (unitType.includes("volume")) return "volume";
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productName } = req.body || {};
  if (!productName) {
    return res.status(400).json({ error: "Missing productName" });
  }

  const normalizedProductName = productName.toLowerCase().trim();

  try {
    // Search for emission factor using Climatiq API
    const searchUrl = `https://api.climatiq.io/data/v1/search?query=${encodeURIComponent(normalizedProductName)}`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return res.status(searchResponse.status).json({ 
        error: 'Climatiq search API failed', 
        details: errorText 
      });
    }

    const searchData = await searchResponse.json();
    const firstResult = searchData.results?.[0];

    if (!firstResult) {
      return res.status(404).json({
        error: `No emission factor found for "${productName}"`,
        suggestion: "Try a more specific product name"
      });
    }

    const { activity_id, unit_type } = firstResult;
    const param = getParameterForUnitType(unit_type);

    if (!param || !defaultValues[param]) {
      return res.status(400).json({
        error: `Unsupported unit type: ${unit_type}`,
        activity_id: activity_id
      });
    }

    const defaults = defaultValues[param];

    // Estimate emissions using Climatiq API
    const payload = {
      emission_factor: {
        activity_id,
        data_version: DATA_VERSION
      },
      parameters: {
        [param]: defaults.value,
        [`${param}_unit`]: defaults.unit
      }
    };

    const estimateResponse = await fetch("https://api.climatiq.io/data/v1/estimate", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!estimateResponse.ok) {
      const errorText = await estimateResponse.text();
      return res.status(estimateResponse.status).json({ 
        error: 'Climatiq estimate API failed', 
        details: errorText 
      });
    }

    const data = await estimateResponse.json();
    
    // Extract CO2e value
    let co2e = 0;
    let unit = "kg CO2e";
    
    if (typeof data.co2e === 'object' && data.co2e !== null) {
      co2e = data.co2e.value || 0;
      unit = data.co2e.unit || unit;
    } else {
      co2e = data.co2e || 0;
    }

    return res.status(200).json({
      productName: normalizedProductName,
      carbonFootprint: Number(co2e.toFixed(4)),
      co2e_unit: unit,
      isEcoFriendly: co2e < 5,
      alternatives: getAlternatives(normalizedProductName),
      activity_id: activity_id,
      source: 'climatiq'
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || String(error)
    });
  }
}