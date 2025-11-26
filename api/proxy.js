export const config = {
  api: {
    bodyParser: false, // VERY IMPORTANT
  },
};

export default async function handler(req, res) {
  try {
    const target = req.query.url;
    if (!target) {
      return res.status(400).json({ error: "Missing target URL (?url=)" });
    }

    // Convert headers
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    // MUST NOT delete content-length for WooCommerce
    delete headers['accept-encoding'];

    // Read raw body manually
    let rawBody = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      rawBody = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
    }

    // Preflight
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      return res.status(200).end();
    }

    // Forward request
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: rawBody,
      redirect: "follow",
    });

    // Copy response text to avoid gzip issues
    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    return res.status(response.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
}
