import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initFirebase } from './services/firebase';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await initFirebase();
  } catch (err) {
    console.warn('Firebase initialization failed, continuing without Firebase:', err.message);
  }
  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Minerva backend running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
