// server/src/controllers/sapController.js
const BASE = (process.env.SAP_BASE_URL || '').replace(/\/+$/, '');
const PATH = process.env.SAP_SUPPLIERS_PATH || '/zsupplier/supplier_detail';

const EXTRA = process.env.SAP_EXTRA_QUERY || ''; // e.g. "sap-client=500,format=json"
const QUERY_KEY = process.env.SAP_QUERY_KEY || 'supplier'; // <- set to the param your API expects

function buildHeaders() {
  const h = { Accept: 'application/json' };
  if (process.env.SAP_API_KEY) {
    h.Authorization = `Bearer ${process.env.SAP_API_KEY}`;
  }
  if (process.env.SAP_USERNAME && process.env.SAP_PASSWORD) {
    const token = Buffer.from(
      `${process.env.SAP_USERNAME}:${process.env.SAP_PASSWORD}`
    ).toString('base64');
    h.Authorization = `Basic ${token}`;
  }
  return h;
}

function addExtraParams(url) {
  if (!EXTRA) return;
  EXTRA.split(',').map(x => x.trim()).filter(Boolean).forEach(kv => {
    const [k, v] = kv.split('=');
    if (k) url.searchParams.set(k.trim(), (v || '').trim());
  });
}

/** GET /api/sap/suppliers?q=abc&limit=10 */
export async function suppliers(req, res) {
  try {
    const { q = '', limit = 10 } = req.query;
    const query = String(q).trim();
    if (query.length < 2) return res.json({ data: [] });

    const url = new URL(`${BASE}${PATH}`);
    addExtraParams(url);                // ensures sap-client=500 is added
    //url.searchParams.set(QUERY_KEY, query);
    //url.searchParams.set('limit', String(limit)); // optional if your API supports it

    // debug (comment out in prod if you want)
    //console.log('SAP Request URL:', url.toString());

    const resp = await fetch(url, { headers: buildHeaders() });
    const text = await resp.text();
    

    if (!resp.ok) {
      console.error('SAP suppliers error:', resp.status, text);
      return res.status(resp.status).json({ error: text || 'SAP error' });
    }

    // Try to parse JSON; if service returns text, wrap it
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // If your endpoint returns plain array or custom text, adjust here
      json = { data: [] };
    }

    
    // Normalize to [{code, name}]
    const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
    const data = list.map((s) => ({
      code: s.LIFNR ?? '',
      name: s.NAME1 ??'',
      raw: s,
    })).filter(x => x.code);

    console.log('SAP Request json:', data);


    res.json({ data });
  } catch (err) {
    console.error('SAP suppliers proxy error:', err?.message || err);
    res.status(400).json({ error: 'Failed to fetch suppliers' });
  }
}
