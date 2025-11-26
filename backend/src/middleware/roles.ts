import { NextFunction, Request, Response } from 'express';

export function ensureRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const roles = user.roles || user.role || [];
    const has = Array.isArray(roles) ? roles.includes(role) : roles === role;
    if (!has) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    return next();
  };
}
