export type Role = 'miner' | 'supervisor' | 'safety-officer' | 'engineer';

export const ROLES = {
  MINER: 'miner' as Role,
  SUPERVISOR: 'supervisor' as Role,
  SAFETY_OFFICER: 'safety-officer' as Role,
  ENGINEER: 'engineer' as Role,
};

export const ROLE_LABELS = {
  miner: 'Miner',
  supervisor: 'Supervisor',
  'safety-officer': 'Safety Officer',
  engineer: 'Engineer',
};

export const ROLE_DESCRIPTIONS = {
  miner: 'Access safety training, equipment checks, and incident reporting',
  supervisor: 'Manage teams, assign tasks, and monitor worker performance',
  'safety-officer': 'Create training content, track compliance, and manage protocols',
  engineer: 'Monitor environmental conditions and analyze structural integrity',
};
