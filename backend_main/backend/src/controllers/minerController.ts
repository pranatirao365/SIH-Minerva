import { Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

function db() {
  return firebaseAdmin.firestore();
}

export async function aiPpeScan(req: Request, res: Response) {
  // stub: accept image, return detected PPE info
  const { imageBase64 } = req.body;
  // here you'd call an AI model; we return a placeholder result
  return res.json({ ok: true, detections: [{ ppe: 'helmet', present: true }] });
}

export async function getChecklist(req: Request, res: Response) {
  const snap = await db().collection('checklists').orderBy('order', 'asc').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function completeChecklistItem(req: Request, res: Response) {
  const { itemId, userId } = req.body;
  if (!itemId || !userId) return res.status(400).json({ error: 'itemId and userId required' });
  await db().collection('checklistResponses').add({ itemId, userId, ts: Date.now() });
  return res.json({ ok: true });
}

export async function sosSignal(req: Request, res: Response) {
  const { uid, location, message } = req.body;
  await db().collection('sos').add({ uid, location, message, ts: Date.now() });
  return res.json({ ok: true });
}

export async function helmetStatus(req: Request, res: Response) {
  const uid = (req as any).user.uid;
  const snap = await db().collection('helmetTelemetry').where('uid', '==', uid).orderBy('ts', 'desc').limit(10).get();
  return res.json(snap.docs.map((d) => d.data()));
}

export async function uploadTestimonial(req: Request, res: Response) {
  const data = req.body;
  const ref = await db().collection('testimonials').add({ ...data, createdAt: Date.now(), status: 'pending' });
  return res.json({ id: ref.id });
}

export async function listTestimonials(req: Request, res: Response) {
  const snap = await db().collection('testimonials').where('status', '==', 'approved').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getProgress(req: Request, res: Response) {
  const uid = (req as any).user.uid;
  const doc = await db().collection('progress').doc(uid).get();
  return res.json(doc.exists ? doc.data() : { achievements: [] });
}

export async function createHazardReport(req: Request, res: Response) {
  const data = req.body;
  const ref = await db().collection('hazardReports').add({ ...data, createdAt: Date.now() });
  return res.json({ id: ref.id });
}

export async function postHealthData(req: Request, res: Response) {
  const uid = (req as any).user.uid;
  const data = req.body;
  await db().collection('health').add({ uid, ...data, ts: Date.now() });
  return res.json({ ok: true });
}

export async function aiAssistantQuery(req: Request, res: Response) {
  const { query } = req.body;
  // stubbed assistant response
  return res.json({ answer: `Assistant stub reply to: ${query}` });
}

export async function getCaseStudies(req: Request, res: Response) {
  const snap = await db().collection('caseStudies').get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getHeatMap(req: Request, res: Response) {
  const snap = await db().collection('heatmap').get();
  return res.json(snap.docs.map((d) => d.data()));
}

export async function offlineSync(req: Request, res: Response) {
  const { records } = req.body;
  if (Array.isArray(records)) {
    const batch = db().batch();
    records.forEach((r: any) => {
      const ref = db().collection('offline').doc();
      batch.set(ref, { ...r, syncedAt: Date.now() });
    });
    await batch.commit();
  }
  return res.json({ ok: true });
}

export async function tollFreeRequest(req: Request, res: Response) {
  const { phoneNumber, message } = req.body;
  // stub: store request for operator to call
  const ref = await db().collection('tollFreeRequests').add({ phoneNumber, message, ts: Date.now() });
  return res.json({ id: ref.id });
}
