import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import routes from './routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));

app.use('/api', routes);

app.get('/', (req, res) => res.json({ ok: true, service: 'minerva-backend' }));

export default app;
