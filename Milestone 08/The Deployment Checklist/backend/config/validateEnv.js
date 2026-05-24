function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }

  console.log('All required environment variables are set.');
}

module.exports = { validateEnv };
