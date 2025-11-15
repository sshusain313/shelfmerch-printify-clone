import express from 'express';
import { createStatusCheck, getStatusChecks } from '../controllers/statusController';

const router = express.Router();

router.post('/', createStatusCheck);
router.get('/', getStatusChecks);

export default router;

