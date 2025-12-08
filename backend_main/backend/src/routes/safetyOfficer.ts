import { Router } from 'express';
import * as controller from '../controllers/safetyController';
import { ensureRole } from '../middleware/roles';

const r = Router();
r.use(ensureRole('safety_officer'));

// Content management
r.post('/content/upload', controller.uploadContent);
r.get('/content', controller.listContent);

// PPE config management
r.post('/ppe/config', controller.updatePpeConfig);

// DGMS compliance tracking
r.get('/dgms', controller.getDgmsStatus);

// Testimonial reviews
r.get('/testimonials/review', controller.listTestimonialsForReview);
r.post('/testimonials/review/:id/approve', controller.approveTestimonial);

// AI video suggestions (stub)
r.get('/ai/video-suggestions', controller.getAiVideoSuggestions);

// SOS alerts
r.get('/sos/alerts', controller.getSosAlerts);

export default r;
