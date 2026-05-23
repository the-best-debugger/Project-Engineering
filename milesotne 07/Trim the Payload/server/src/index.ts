import express from 'express';
import cors from 'cors';
import compression from 'compression';
import ordersRouter from './routes/orders';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/orders', ordersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', server: 'optimized' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
