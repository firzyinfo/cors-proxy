export default async function handler(req, res) {
  try {
    const target = req.query.url;

    if (!target) {
      return res.status(400).json({ error: "Missing target URL (?url=)" });
    }

    // Always remove compression headers
    const outgoingHeaders = { ...req.headers };
    delete outgoingHeaders['accept-encoding'];

    // Forward request to target URL
    const response = await fetch(target, {
      method: req.method,
      headers: outgoingHeaders,
      body: req.method !== "GET" ? req.body : undefined,
      redirect: "follow"
    });

    // Copy headers but remove compression
    response.headers.forEach((value, key) => {
      if (
        key !== "content-encoding" &&
        key !== "transfer-encoding"
      ) {
        res.setHeader(key, value);
      }
    });

    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    // Handle preflight
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Read body as text to avoid decoding problems
    const text = await response.text();

    return res.status(response.status).send(text);

  } catch (err) {
    return res.status(500).json({
      error: err.message || "Proxy error"
    });
  }
}
