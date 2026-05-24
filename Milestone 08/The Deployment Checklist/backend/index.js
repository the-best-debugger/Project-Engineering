require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { validateEnv } = require('./config/validateEnv');
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origin: ${process.env.CORS_ORIGIN}`);
});
