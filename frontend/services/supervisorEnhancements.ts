
<<<<<<< HEAD
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.16.85.150'}:4000/api`;
=======
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.20.10.2'}:4000/api`;
>>>>>>> 528492da79a4bb2061d86a78444e23a31b5563c5

// PPE Compliance Monitor Services
export const getPPEScanResults = async (status?: string, minerId?: string) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (minerId) params.append('minerId', minerId);

    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/ppe-scans?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch PPE scan results');
    return await response.json();
  } catch (error) {
    console.error('Error fetching PPE scan results:', error);
    throw error;
  }
};

export const requestReScan = async (scanId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/ppe-scans/request-rescan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanId }),
    });
    if (!response.ok) throw new Error('Failed to request re-scan');
    return await response.json();
  } catch (error) {
    console.error('Error requesting re-scan:', error);
    throw error;
  }
};

// Team Task Status Services
export const getTeamTaskStatus = async (supervisorId: string, status?: string) => {
  try {
    const params = new URLSearchParams({ supervisorId });
    if (status && status !== 'all') params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/team-tasks?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch team task status');
    return await response.json();
  } catch (error) {
    console.error('Error fetching team task status:', error);
    throw error;
  }
};

export const assignTasksToMiners = async (minerIds: string[], tasks: any[], date?: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/team-tasks/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minerIds, tasks, date }),
    });
    if (!response.ok) throw new Error('Failed to assign tasks');
    return await response.json();
  } catch (error) {
    console.error('Error assigning tasks:', error);
    throw error;
  }
};

// Health Monitoring Services
export const getMinerVitals = async (minerId?: string, status?: string) => {
  try {
    const params = new URLSearchParams();
    if (minerId) params.append('minerId', minerId);
    if (status && status !== 'all') params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/miner-vitals?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch miner vitals');
    return await response.json();
  } catch (error) {
    console.error('Error fetching miner vitals:', error);
    throw error;
  }
};

export const updateFitnessStatus = async (minerId: string, status: string, reason?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/miner-vitals/update-fitness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minerId, status, reason }),
    });
    if (!response.ok) throw new Error('Failed to update fitness status');
    return await response.json();
  } catch (error) {
    console.error('Error updating fitness status:', error);
    throw error;
  }
};

// Hazard Zone Heat Map Services
export const generateHeatMapData = async (timeRange?: number) => {
  try {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange.toString());

    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/hazard-zones?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to generate heat map data');
    return await response.json();
  } catch (error) {
    console.error('Error generating heat map data:', error);
    throw error;
  }
};

export const getZoneDetails = async (zoneId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/hazard-zones/${zoneId}`);
    if (!response.ok) throw new Error('Failed to fetch zone details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching zone details:', error);
    throw error;
  }
};

// Performance Tracking Services
export const calculateSafetyScore = async (minerId?: string) => {
  try {
    const params = new URLSearchParams();
    if (minerId) params.append('minerId', minerId);

    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/performance?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to calculate safety scores');
    return await response.json();
  } catch (error) {
    console.error('Error calculating safety scores:', error);
    throw error;
  }
};

export const awardBadge = async (minerId: string, badgeName: string, reason?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor-enhancements/performance/award-badge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minerId, badgeName, reason }),
    });
    if (!response.ok) throw new Error('Failed to award badge');
    return await response.json();
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
};

// Helper function to format timestamps
export const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};
