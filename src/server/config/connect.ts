// src/server/config/connect.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from './mongodb';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

const withDB = (handler: Handler) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await connectDB();
    await handler(req, res);
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

export default withDB;