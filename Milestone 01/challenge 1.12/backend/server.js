const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Initialize dotenv at the top
dotenv.config();

const app = express();
const startPort = Number(process.env.PORT || 3002);
const maxPortSearchAttempts = Number(process.env.PORT_SEARCH_MAX || 20);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Health check route to verify server status
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

/**
 * AI Chat Route
 * This is where the magic happens.
 */
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "`messages` must be an array" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // This should never be sent to the browser in production, but it's useful for local setup.
      return res.status(500).json({ error: "OPENROUTER_API_KEY is not set on the server" });
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter recommends including these for attribution/analytics (safe, not a secret).
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Kalvium Challenge 1.12',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      return res.status(openRouterResponse.status).json({
        error: "OpenRouter request failed",
        details: errorText,
      });
    }

    const data = await openRouterResponse.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === 'string'
        ? data.choices[0].message.content
        : null;

    if (!reply) {
      return res.status(500).json({ error: "No reply returned from OpenRouter" });
    }

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error", details: String(err) });
  }
});

function tryListen(port, attemptsRemaining) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve({ server, port }));
    server.once('error', (err) => {
      // If the port is already taken, try the next one (common when multiple challenges are open).
      if (err && err.code === 'EADDRINUSE' && attemptsRemaining > 0) {
        resolve(tryListen(port + 1, attemptsRemaining - 1));
        return;
      }
      reject(err);
    });
  });
}

(async () => {
  const result = await tryListen(startPort, maxPortSearchAttempts);
  // Keep a single log line so it is easy to spot the live port.
  console.log(`Server is running on port ${result.port}`);
})();
