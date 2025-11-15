import { Request, Response } from 'express';
import { StatusCheck } from '../models/StatusCheck';
import { IStatusCheckCreate } from '../types';

export const createStatusCheck = async (req: Request, res: Response) => {
  try {
    const input: IStatusCheckCreate = req.body;
    const statusCheck = new StatusCheck({
      client_name: input.client_name,
      timestamp: new Date()
    });
    await statusCheck.save();
    res.json(statusCheck);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStatusChecks = async (req: Request, res: Response) => {
  try {
    const statusChecks = await StatusCheck.find().limit(1000);
    res.json(statusChecks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

