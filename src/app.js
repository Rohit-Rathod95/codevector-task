import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/products', productsRouter);

export default app;
