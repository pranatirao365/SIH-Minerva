import { mockWorkers } from './mockData';

/**
 * PRODUCTION VERSION - Replace with real API calls:
 *
 * export async function getRegisteredMiners() {
 *   const response = await fetch('/api/miners');
 *   return response.json();
 * }
 *
 * For now, using mock data for development
 */

/**
 * Get all registered miners from the system
 * In a real app, this would fetch from a database or API
 */
export function getRegisteredMiners() {
  return mockWorkers.filter(worker => worker.role === 'Miner');
}

/**
 * Get a miner by ID
 * In a real app, this would fetch from a database or API
 */
export function getMinerById(minerId: string) {
  return mockWorkers.find(worker => worker.id === minerId && worker.role === 'Miner');
}

/**
 * Get miners by status
 * In a real app, this would fetch from a database or API
 */
export function getMinersByStatus(status: string) {
  return mockWorkers.filter(worker => worker.role === 'Miner' && worker.status === status);
}

/**
 * Get all active miners
 * In a real app, this would fetch from a database or API
 */
export function getActiveMiners() {
  return mockWorkers.filter(worker => worker.role === 'Miner' && worker.status === 'active');
}