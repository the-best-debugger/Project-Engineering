import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const morganFormat =
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

app.use(cors());
app.use(express.json());
app.use(morgan(morganFormat));

app.use('/api/products', productRoutes);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockapi')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
