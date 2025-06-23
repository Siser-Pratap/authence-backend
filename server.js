import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

import companyRoutes from './routes/company/companyRoutes.js';
import clientRoutes from './routes/client/clientRoute.js';

app.use('/company', companyRoutes);         
app.use('/', clientRoutes);               

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
