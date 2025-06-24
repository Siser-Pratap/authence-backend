import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import companyRoutes from './routes/company/companyRoutes.js';
import clientRoutes from './routes/client/clientRoute.js';
import connectDB from './db/mongo.js';

dotenv.config();


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

connectDB();

app.use('/company', companyRoutes);         
app.use('/user', clientRoutes);               

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
