import { Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

function db() {
  return firebaseAdmin.firestore();
}

export async function uploadContent(req: Request, res: Response) {
  const data = req.body;
  const ref = await db().collection('content').add({ ...data, uploadedAt: Date.now() });
  return res.json({ id: ref.id });
}

export async function listContent(req: Request, res: Response) {
  const snap = await db().collection('content').orderBy('uploadedAt', 'desc').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function updatePpeConfig(req: Request, res: Response) {
  const { key, config } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  await db().collection('ppeConfigs').doc(key).set({ config, updatedAt: Date.now() });
  return res.json({ ok: true });
}

export async function getDgmsStatus(req: Request, res: Response) {
  const snap = await db().collection('dgms').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function listTestimonialsForReview(req: Request, res: Response) {
  const snap = await db().collection('testimonials').where('status', '==', 'pending').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function approveTestimonial(req: Request, res: Response) {
  const id = req.params.id;
  const ref = db().collection('testimonials').doc(id);
  await ref.update({ status: 'approved', reviewedAt: Date.now() });
  return res.json({ ok: true });
}

export async function getAiVideoSuggestions(req: Request, res: Response) {
  // stub: would call AI/ML pipeline
  return res.json({ suggestions: [] });
}
