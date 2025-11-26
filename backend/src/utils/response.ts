import { Response } from 'express';

export function ok(res: Response, data: any) {
  return res.json({ ok: true, data });
}

export function fail(res: Response, code: number, message: string) {
  return res.status(code).json({ ok: false, error: message });
}
