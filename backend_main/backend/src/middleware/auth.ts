import { NextFunction, Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    // fetch user doc for role info
    const userDoc = await firebaseAdmin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    (req as any).user = { uid, email: decoded.email, ...userData };
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Auth failed', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
