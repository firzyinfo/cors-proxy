export default async function handler(req, res) {
  try {
    // 1. Extract target URL
    const target = req.query.url;
    if (!target) {
      return res.status(400).json({ error: "Missing target URL (?url=)" });
    }

    // 2. Prepare outgoing headers
    const headers = { ...req.headers };

    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    delete headers["accept-encoding"];  // SUPER IMPORTANT
    delete headers["content-length"];

    // 3. Handle Preflight
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      return res.status(200).end();
    }

    // 4. Forward request to target WooCommerce API
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : req.body, 
      redirect: "follow"
    });

    // 5. Read as text to avoid decompression issues
    const text = await response.text();

    // 6. Apply proxy CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    // 7. Prevent encoding mismatches
    res.removeHeader("content-encoding");
    res.removeHeader("transfer-encoding");

    res.status(response.status).send(text);

  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy error" });
  }
}
