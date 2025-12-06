import { Router } from 'express';
import { firebaseAuth } from '../middleware/auth';
import admin from './admin';
import miner from './miner';
import safetyOfficer from './safetyOfficer';
import supervisor from './supervisor';
import supervisorEnhancements from './supervisorEnhancements';
import videoGeneration from './videoGeneration.routes';

const router = Router();

// public/ping
router.get('/ping', (req, res) => res.json({ ok: true }));

// Video generation routes (can be public or protected based on needs)
router.use('/video', videoGeneration);

// protected routes
router.use(firebaseAuth);

router.use('/supervisor', supervisor);
router.use('/supervisor-enhancements', supervisorEnhancements);
router.use('/miner', miner);
router.use('/safety', safetyOfficer);
router.use('/admin', admin);

export default router;
