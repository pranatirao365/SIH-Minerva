import { Request, Response } from 'express';
import { firebaseAdmin } from '../services/firebase';

function db() {
  return firebaseAdmin.firestore();
}

// PPE Compliance Monitor Endpoints
export async function getPPEScanResults(req: Request, res: Response) {
  try {
    const { status, minerId } = req.query;
    let query = db().collection('ppeScans').orderBy('timestamp', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }
    if (minerId) {
      query = query.where('minerId', '==', minerId) as any;
    }

    const snap = await query.limit(100).get();
    const scans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(scans);
  } catch (error) {
    console.error('Error getting PPE scan results:', error);
    return res.status(500).json({ error: 'Failed to fetch PPE scan results' });
  }
}

export async function requestReScan(req: Request, res: Response) {
  try {
    const { scanId } = req.body;
    if (!scanId) return res.status(400).json({ error: 'scanId required' });

    const scanRef = db().collection('ppeScans').doc(scanId);
    const scanDoc = await scanRef.get();
    
    if (!scanDoc.exists) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    await scanRef.update({
      rescanRequested: true,
      rescanRequestedAt: Date.now(),
      rescanRequestedBy: (req as any).user?.uid || 'supervisor',
    });

    // Create notification for miner
    const scanData = scanDoc.data();
    await db().collection('notifications').add({
      userId: scanData?.userId,
      type: 'rescan_required',
      title: 'PPE Re-scan Required',
      message: 'Your supervisor has requested a PPE re-scan. Please complete it as soon as possible.',
      timestamp: Date.now(),
      read: false,
    });

    return res.json({ success: true, message: 'Re-scan requested successfully' });
  } catch (error) {
    console.error('Error requesting re-scan:', error);
    return res.status(500).json({ error: 'Failed to request re-scan' });
  }
}

// Team Task Status Endpoints
export async function getTeamTaskStatus(req: Request, res: Response) {
  try {
    const { supervisorId, status } = req.query;
    
    // Get all miners under this supervisor
    const minersSnap = await db().collection('users')
      .where('role', '==', 'miner')
      .where('supervisorId', '==', supervisorId || 'supervisor1')
      .get();

    const minerIds = minersSnap.docs.map(d => d.id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Get tasks for today
    const tasksPromises = minerIds.map(async (minerId) => {
      const tasksSnap = await db().collection('tasks')
        .where('minerId', '==', minerId)
        .where('date', '>=', todayTimestamp)
        .get();

      const tasks = tasksSnap.docs.map(d => d.data());
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      const minerDoc = minersSnap.docs.find(d => d.id === minerId);
      const minerData = minerDoc?.data();

      // Determine overall status
      let taskStatus = 'not_started';
      if (completedTasks === totalTasks && totalTasks > 0) {
        taskStatus = 'completed';
      } else if (completedTasks > 0) {
        taskStatus = 'in_progress';
      } else if (minerData?.attendance === false) {
        taskStatus = 'absent';
      }

      return {
        id: minerId,
        minerId: minerData?.employeeId || minerId,
        minerName: minerData?.name || 'Unknown',
        status: taskStatus,
        tasksAssigned: totalTasks,
        tasksCompleted: completedTasks,
        lastUpdate: tasks.length > 0 ? Math.max(...tasks.map(t => t.updatedAt || t.createdAt)) : Date.now(),
      };
    });

    const minerTasks = await Promise.all(tasksPromises);
    
    // Filter by status if provided
    const filteredTasks = status && status !== 'all' 
      ? minerTasks.filter(mt => mt.status === status)
      : minerTasks;

    return res.json(filteredTasks);
  } catch (error) {
    console.error('Error getting team task status:', error);
    return res.status(500).json({ error: 'Failed to fetch team task status' });
  }
}

export async function assignTasksToMiners(req: Request, res: Response) {
  try {
    const { minerIds, tasks, date } = req.body;
    
    if (!minerIds || !Array.isArray(minerIds) || minerIds.length === 0) {
      return res.status(400).json({ error: 'minerIds array required' });
    }
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array required' });
    }

    const batch = db().batch();
    const taskDate = date || Date.now();

    minerIds.forEach(minerId => {
      tasks.forEach(task => {
        const taskRef = db().collection('tasks').doc();
        batch.set(taskRef, {
          minerId,
          title: task.title,
          description: task.description,
          priority: task.priority || 'medium',
          status: 'not_started',
          date: taskDate,
          createdAt: Date.now(),
          assignedBy: (req as any).user?.uid || 'supervisor',
        });
      });
    });

    await batch.commit();
    return res.json({ success: true, message: `${tasks.length * minerIds.length} tasks assigned` });
  } catch (error) {
    console.error('Error assigning tasks:', error);
    return res.status(500).json({ error: 'Failed to assign tasks' });
  }
}

// Health Monitoring Endpoints
export async function getMinerVitals(req: Request, res: Response) {
  try {
    const { minerId, status } = req.query;
    
    let query = db().collection('users').where('role', '==', 'miner');
    
    if (minerId) {
      query = query.where('employeeId', '==', minerId) as any;
    }

    const minersSnap = await query.get();
    
    const vitalsPromises = minersSnap.docs.map(async (minerDoc) => {
      const minerId = minerDoc.id;
      const minerData = minerDoc.data();

      // Get latest vitals
      const vitalsSnap = await db().collection('minerVitals')
        .where('minerId', '==', minerId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      const vitals = vitalsSnap.empty ? null : vitalsSnap.docs[0].data();

      // Calculate fitness status based on vitals
      let fitnessStatus = 'fit';
      let trend = 'stable';
      
      if (vitals) {
        const hr = vitals.heartRate || 0;
        const spo2 = vitals.spO2 || 100;
        const temp = vitals.temperature || 37;

        if (hr > 120 || spo2 < 90 || temp > 38.5) {
          fitnessStatus = 'unfit';
          trend = 'declining';
        } else if (hr > 100 || spo2 < 95 || temp > 37.5) {
          fitnessStatus = 'monitor';
          trend = 'declining';
        }

        // Check if improving based on previous reading
        const prevVitalsSnap = await db().collection('minerVitals')
          .where('minerId', '==', minerId)
          .orderBy('timestamp', 'desc')
          .limit(2)
          .get();
        
        if (prevVitalsSnap.docs.length === 2) {
          const prev = prevVitalsSnap.docs[1].data();
          if (vitals.heartRate < prev.heartRate && vitals.temperature < prev.temperature) {
            trend = 'improving';
          }
        }
      }

      const result = {
        id: minerId,
        minerId: minerData.employeeId || minerId,
        minerName: minerData.name || 'Unknown',
        heartRate: vitals?.heartRate || 0,
        spO2: vitals?.spO2 || 0,
        temperature: vitals?.temperature || 0,
        fitnessStatus,
        lastUpdate: vitals?.timestamp ? new Date(vitals.timestamp).toLocaleString() : 'N/A',
        trend,
      };

      return result;
    });

    let vitalsData = await Promise.all(vitalsPromises);

    // Filter by fitness status if provided
    if (status && status !== 'all') {
      vitalsData = vitalsData.filter(v => v.fitnessStatus === status);
    }

    return res.json(vitalsData);
  } catch (error) {
    console.error('Error getting miner vitals:', error);
    return res.status(500).json({ error: 'Failed to fetch miner vitals' });
  }
}

export async function updateFitnessStatus(req: Request, res: Response) {
  try {
    const { minerId, status, reason } = req.body;
    
    if (!minerId || !status) {
      return res.status(400).json({ error: 'minerId and status required' });
    }

    // Find user by employeeId
    const userSnap = await db().collection('users')
      .where('employeeId', '==', minerId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'Miner not found' });
    }

    const userId = userSnap.docs[0].id;

    // Update fitness status
    await db().collection('users').doc(userId).update({
      fitnessStatus: status,
      fitnessStatusUpdatedAt: Date.now(),
      fitnessStatusUpdatedBy: (req as any).user?.uid || 'supervisor',
      fitnessStatusReason: reason || '',
    });

    // Log the change
    await db().collection('fitnessStatusLog').add({
      minerId: userId,
      status,
      reason: reason || '',
      updatedBy: (req as any).user?.uid || 'supervisor',
      timestamp: Date.now(),
    });

    // Send notification if unfit
    if (status === 'unfit') {
      await db().collection('notifications').add({
        userId,
        type: 'fitness_alert',
        title: 'Fitness Status Updated',
        message: `You have been marked as unfit for duty. ${reason || 'Please contact your supervisor.'}`,
        timestamp: Date.now(),
        read: false,
      });
    }

    return res.json({ success: true, message: 'Fitness status updated' });
  } catch (error) {
    console.error('Error updating fitness status:', error);
    return res.status(500).json({ error: 'Failed to update fitness status' });
  }
}

// Hazard Zone Heat Map Endpoints
export async function generateHeatMapData(req: Request, res: Response) {
  try {
    const { timeRange } = req.query;
    
    const hoursAgo = timeRange ? parseInt(timeRange as string) : 24;
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

    // Get recent incidents
    const incidentsSnap = await db().collection('incidents')
      .where('timestamp', '>=', cutoffTime)
      .get();

    // Get hazard zones
    const zonesSnap = await db().collection('hazardZones').get();
    
    const zones = zonesSnap.docs.map(doc => {
      const data = doc.data();
      
      // Count incidents in this zone
      const zoneIncidents = incidentsSnap.docs.filter(incDoc => {
        const incData = incDoc.data();
        return incData.zoneId === doc.id;
      });

      // Calculate density score based on incidents and zone data
      const baseScore = data.baseHazardScore || 20;
      const incidentScore = Math.min(zoneIncidents.length * 10, 50);
      const density = Math.min(baseScore + incidentScore, 100);

      // Determine hazard level
      let hazardLevel = 'low';
      if (density > 75) hazardLevel = 'critical';
      else if (density > 50) hazardLevel = 'high';
      else if (density > 25) hazardLevel = 'medium';

      const lastIncident = zoneIncidents.length > 0
        ? Math.max(...zoneIncidents.map(i => i.data().timestamp))
        : data.lastIncidentTime || 0;

      return {
        id: doc.id,
        zoneName: data.name || `Zone ${doc.id}`,
        coordinates: data.coordinates || { x: 0, y: 0 },
        hazardLevel,
        density,
        incidents: zoneIncidents.length,
        lastIncident: lastIncident > 0 ? new Date(lastIncident).toLocaleString() : 'N/A',
        hazardTypes: data.hazardTypes || ['Unknown'],
      };
    });

    return res.json(zones);
  } catch (error) {
    console.error('Error generating heat map:', error);
    return res.status(500).json({ error: 'Failed to generate heat map data' });
  }
}

export async function getZoneDetails(req: Request, res: Response) {
  try {
    const { zoneId } = req.params;
    
    const zoneDoc = await db().collection('hazardZones').doc(zoneId).get();
    
    if (!zoneDoc.exists) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const zoneData = zoneDoc.data();

    // Get recent incidents in this zone
    const incidentsSnap = await db().collection('incidents')
      .where('zoneId', '==', zoneId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const incidents = incidentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.json({
      id: zoneId,
      ...zoneData,
      recentIncidents: incidents,
    });
  } catch (error) {
    console.error('Error getting zone details:', error);
    return res.status(500).json({ error: 'Failed to fetch zone details' });
  }
}

// Performance Tracking Endpoints
export async function calculateSafetyScore(req: Request, res: Response) {
  try {
    const { minerId } = req.query;
    
    let query = db().collection('users').where('role', '==', 'miner');
    
    if (minerId) {
      query = query.where('employeeId', '==', minerId) as any;
    }

    const minersSnap = await query.get();
    
    const performancePromises = minersSnap.docs.map(async (minerDoc) => {
      const userId = minerDoc.id;
      const minerData = minerDoc.data();

      // Calculate task completion rate (30%)
      const tasksSnap = await db().collection('tasks')
        .where('minerId', '==', userId)
        .get();
      const tasks = tasksSnap.docs.map(d => d.data());
      const taskCompletionRate = tasks.length > 0 
        ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
        : 0;

      // Calculate PPE compliance rate (25%)
      const ppeSnap = await db().collection('ppeScans')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      const ppeScans = ppeSnap.docs.map(d => d.data());
      const ppeComplianceRate = ppeScans.length > 0
        ? (ppeScans.filter(s => s.status === 'pass').length / ppeScans.length) * 100
        : 100;

      // Calculate incident-free streak (25%)
      const incidentsSnap = await db().collection('incidents')
        .where('minerId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      const lastIncident = incidentsSnap.empty ? 0 : incidentsSnap.docs[0].data().timestamp;
      const daysSinceIncident = lastIncident > 0 
        ? Math.floor((Date.now() - lastIncident) / (24 * 60 * 60 * 1000))
        : 365;
      const incidentScore = Math.min(daysSinceIncident / 3.65, 100); // Max at 365 days

      // Calculate training score (20%)
      const trainingsSnap = await db().collection('trainings')
        .where('minerId', '==', userId)
        .where('status', '==', 'completed')
        .get();
      const trainingsCompleted = trainingsSnap.size;
      const trainingScore = Math.min(trainingsCompleted * 20, 100);

      // Calculate overall safety score
      const safetyScore = Math.round(
        (taskCompletionRate * 0.30) +
        (ppeComplianceRate * 0.25) +
        (incidentScore * 0.25) +
        (trainingScore * 0.20)
      );

      // Get badges
      const badges: string[] = [];
      if (safetyScore >= 95) badges.push('Safety Star');
      if (daysSinceIncident >= 100) badges.push('100 Days');
      if (daysSinceIncident >= 50) badges.push('50 Days');
      if (ppeComplianceRate >= 98) badges.push('PPE Champion');
      if (taskCompletionRate >= 95) badges.push('Task Master');
      if (badges.length === 0) badges.push('Newcomer');

      // Determine trend (compare with previous week)
      const prevPerformance = minerData.previousSafetyScore || safetyScore;
      let trend = 'stable';
      if (safetyScore > prevPerformance + 2) trend = 'up';
      else if (safetyScore < prevPerformance - 2) trend = 'down';

      // Update user's performance data
      await db().collection('users').doc(userId).update({
        safetyScore,
        previousSafetyScore: safetyScore,
        lastPerformanceUpdate: Date.now(),
      });

      return {
        id: userId,
        minerId: minerData.employeeId || userId,
        minerName: minerData.name || 'Unknown',
        safetyScore,
        badges,
        taskCompletionRate: Math.round(taskCompletionRate),
        ppeComplianceRate: Math.round(ppeComplianceRate),
        incidentFreeStreak: daysSinceIncident,
        trainingScore: Math.round(trainingScore),
        rank: 0, // Will be set after sorting
        trend,
      };
    });

    let performanceData = await Promise.all(performancePromises);

    // Sort by safety score and assign ranks
    performanceData.sort((a, b) => b.safetyScore - a.safetyScore);
    performanceData = performanceData.map((p, index) => ({ ...p, rank: index + 1 }));

    return res.json(performanceData);
  } catch (error) {
    console.error('Error calculating safety scores:', error);
    return res.status(500).json({ error: 'Failed to calculate safety scores' });
  }
}

export async function awardBadge(req: Request, res: Response) {
  try {
    const { minerId, badgeName, reason } = req.body;
    
    if (!minerId || !badgeName) {
      return res.status(400).json({ error: 'minerId and badgeName required' });
    }

    // Find user
    const userSnap = await db().collection('users')
      .where('employeeId', '==', minerId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'Miner not found' });
    }

    const userId = userSnap.docs[0].id;

    // Award badge
    await db().collection('achievements').add({
      minerId: userId,
      badgeName,
      reason: reason || '',
      awardedBy: (req as any).user?.uid || 'supervisor',
      timestamp: Date.now(),
    });

    // Send notification
    await db().collection('notifications').add({
      userId,
      type: 'badge_awarded',
      title: 'New Badge Earned!',
      message: `Congratulations! You've earned the "${badgeName}" badge. ${reason || ''}`,
      timestamp: Date.now(),
      read: false,
    });

    return res.json({ success: true, message: 'Badge awarded successfully' });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return res.status(500).json({ error: 'Failed to award badge' });
  }
}
