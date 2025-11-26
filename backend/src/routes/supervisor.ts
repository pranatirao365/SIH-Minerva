import { Router } from 'express';
import * as controller from '../controllers/supervisorController';
import { ensureRole } from '../middleware/roles';

const r = Router();

r.use(ensureRole('supervisor'));

// Work assignments
r.get('/work-assignments', controller.listWorkAssignments);
r.post('/work-assignments', controller.createWorkAssignment);

// Reported incidents
r.get('/incidents', controller.listIncidents);

// Live helmet monitoring (streaming / snapshot)
r.get('/live-helmet', controller.getLiveHelmetStatus);

// Attendance validation
r.post('/attendance/validate', controller.validateAttendance);

// Team status (daily task completion)
r.get('/team-status', controller.getTeamStatus);

export default r;
