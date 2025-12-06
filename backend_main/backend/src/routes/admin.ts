import { Router } from 'express';
import * as controller from '../controllers/adminController';
import { ensureRole } from '../middleware/roles';

const r = Router();
r.use(ensureRole('admin'));

// User management
r.get('/users', controller.listUsers);
r.post('/users', controller.createUser);

// System maintenance
r.post('/system/maintenance', controller.performMaintenance);

// Official news
r.post('/news', controller.postNews);
r.get('/news', controller.listNews);

export default r;
