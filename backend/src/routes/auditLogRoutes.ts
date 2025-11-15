import express from 'express';
import {
  getAuditLogs,
  getAuditStats
} from '../controllers/auditLogController';

const router = express.Router();

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;

