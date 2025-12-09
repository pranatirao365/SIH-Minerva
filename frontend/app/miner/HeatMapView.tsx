/**
 * Miner Heat Map View
 * Uses the same HazardZoneHeatMap component as Safety Officer
 * Shows real-time hazard detection, miner locations, and PPE status
 */
import HazardZoneHeatMap from '../safety-officer/HazardZoneHeatMap';

export default function HeatMapView() {
  // Simply export the same HazardZoneHeatMap used by safety officer
  return <HazardZoneHeatMap />;
}
