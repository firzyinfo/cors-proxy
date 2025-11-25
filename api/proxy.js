export default async function handler(req, res) {
  try {
    const target = req.query.url;
    if (!target) {
      return res.status(400).json({ error: "Missing target URL (?url=)" });
    }

    // fetch target
    const response = await fetch(target, {
      method: req.method,
      headers: {
        ...req.headers,
        host: ""
      },
      body: req.method !== "GET" ? req.body : undefined
    });

    // copy headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({
      error: err.message || "Proxy error"
    });
  }
}
