// src/config/validateEnv.js
// Fail fast if required secrets are missing at boot time.

function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ FATAL: Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      "Copy .env.example to .env and set all values before starting the server."
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are set.");
}

module.exports = { validateEnv };
