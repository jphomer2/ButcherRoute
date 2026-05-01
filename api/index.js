import express from 'express';
import cors from 'cors';
import parseRoutes from '../server/routes/parse.js';
import customersRoutes from '../server/routes/customers.js';
import driversRoutes from '../server/routes/drivers.js';
import runsRoutes from '../server/routes/runs.js';
import optimiseRoutes from '../server/routes/optimise.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/parse', parseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/optimise', optimiseRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
