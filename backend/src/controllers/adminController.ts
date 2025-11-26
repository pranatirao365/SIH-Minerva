import { Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

function db() {
  return firebaseAdmin.firestore();
}

export async function listUsers(req: Request, res: Response) {
  const snap = await db().collection('users').limit(200).get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function createUser(req: Request, res: Response) {
  const { uid, data } = req.body;
  if (!uid || !data) return res.status(400).json({ error: 'uid and data required' });
  await db().collection('users').doc(uid).set(data, { merge: true });
  return res.json({ ok: true });
}

export async function performMaintenance(req: Request, res: Response) {
  // stub for system maintenance tasks
  return res.json({ ok: true, note: 'maintenance task queued' });
}

export async function postNews(req: Request, res: Response) {
  const data = req.body;
  const ref = await db().collection('news').add({ ...data, ts: Date.now() });
  return res.json({ id: ref.id });
}

export async function listNews(req: Request, res: Response) {
  const snap = await db().collection('news').orderBy('ts', 'desc').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}
