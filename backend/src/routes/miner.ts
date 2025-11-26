import { Router } from 'express';
import * as controller from '../controllers/minerController';
import { ensureRole } from '../middleware/roles';

const r = Router();
r.use(ensureRole('miner'));

// AI PPE scanning
r.post('/ppe-scan', controller.aiPpeScan);

// Day to day task checklist / content
r.get('/checklist', controller.getChecklist);
r.post('/checklist/complete', controller.completeChecklistItem);

// SOS button
r.post('/sos', controller.sosSignal);

// Smart helmet status
r.get('/helmet-status', controller.helmetStatus);

// Testimonials
r.post('/testimonials', controller.uploadTestimonial);
r.get('/testimonials', controller.listTestimonials);

// Progress / achievements
r.get('/progress', controller.getProgress);

// Hazard reporting (photo/video/voice)
r.post('/hazard-report', controller.createHazardReport);

// Health monitor
r.post('/health', controller.postHealthData);

// AI assistant
r.post('/assistant/query', controller.aiAssistantQuery);

// Case studies
r.get('/case-studies', controller.getCaseStudies);

// Heatmap (hazard zone)
r.get('/heatmap', controller.getHeatMap);

// Offline sync
r.post('/offline-sync', controller.offlineSync);

// Toll-free: submit SMS/IVR request (stub)
r.post('/toll-free', controller.tollFreeRequest);

export default r;
