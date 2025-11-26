import { Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

function db() {
  return firebaseAdmin.firestore();
}

export async function listWorkAssignments(req: Request, res: Response) {
  const snap = await db().collection('workAssignments').get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return res.json(items);
}

export async function createWorkAssignment(req: Request, res: Response) {
  const data = req.body;
  const ref = await db().collection('workAssignments').add({ ...data, createdAt: Date.now() });
  return res.json({ id: ref.id });
}

export async function listIncidents(req: Request, res: Response) {
  const snap = await db().collection('incidents').orderBy('createdAt', 'desc').limit(100).get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getLiveHelmetStatus(req: Request, res: Response) {
  // stub: read latest helmet telemetry
  const snap = await db().collection('helmetTelemetry').orderBy('ts', 'desc').limit(100).get();
  return res.json(snap.docs.map((d) => d.data()));
}

export async function validateAttendance(req: Request, res: Response) {
  const { uid, timestamp } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  await db().collection('attendanceValidations').add({ uid, timestamp: timestamp || Date.now(), validator: (req as any).user.uid });
  return res.json({ ok: true });
}

export async function getTeamStatus(req: Request, res: Response) {
  const teamId = req.query.teamId as string | undefined;
  const q = teamId ? db().collection('teamStatus').where('teamId', '==', teamId) : db().collection('teamStatus');
  const snap = await q.get();
  return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}
