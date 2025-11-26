import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initFirebase } from './services/firebase';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await initFirebase();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Minerva backend running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
