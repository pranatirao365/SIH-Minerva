import { Router } from 'express';
import * as supervisorEnhancementsController from '../controllers/supervisorEnhancementsController';

const router = Router();

// PPE Compliance Monitor Routes
router.get('/ppe-scans', supervisorEnhancementsController.getPPEScanResults);
router.post('/ppe-scans/request-rescan', supervisorEnhancementsController.requestReScan);

// Team Task Status Routes
router.get('/team-tasks', supervisorEnhancementsController.getTeamTaskStatus);
router.post('/team-tasks/assign', supervisorEnhancementsController.assignTasksToMiners);

// Health Monitoring Routes
router.get('/miner-vitals', supervisorEnhancementsController.getMinerVitals);
router.post('/miner-vitals/update-fitness', supervisorEnhancementsController.updateFitnessStatus);

// Hazard Zone Heat Map Routes
router.get('/hazard-zones', supervisorEnhancementsController.generateHeatMapData);
router.get('/hazard-zones/:zoneId', supervisorEnhancementsController.getZoneDetails);

// Performance Tracking Routes
router.get('/performance', supervisorEnhancementsController.calculateSafetyScore);
router.post('/performance/award-badge', supervisorEnhancementsController.awardBadge);

export default router;
