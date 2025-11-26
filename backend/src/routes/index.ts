import { Router } from 'express';
import { firebaseAuth } from '../middleware/auth';
import admin from './admin';
import miner from './miner';
import safetyOfficer from './safetyOfficer';
import supervisor from './supervisor';

const router = Router();

// public/ping
router.get('/ping', (req, res) => res.json({ ok: true }));

// protected routes
router.use(firebaseAuth);

router.use('/supervisor', supervisor);
router.use('/miner', miner);
router.use('/safety', safetyOfficer);
router.use('/admin', admin);

export default router;
