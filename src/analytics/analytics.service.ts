import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DateTime } from 'luxon';
import { MeterReading } from '../meter-readings/entities/meter-reading.entity';
import { VehicleReading } from '../vehicle-readings/entities/vehicle-reading.entity';

export interface VehiclePerformance {
  vehicleId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalEnergyConsumedAc: number; // kWh from charger
  totalEnergyDeliveredDc: number; // kWh to vehicle
  efficiencyRatio: number; // DC/AC ratio
  avgBatteryTemperature: number; // Average battery temp
  dataPoints: number;
}

// Helper function to round numbers
function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(MeterReading)
    private readonly meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(VehicleReading)
    private readonly vehicleReadingRepository: Repository<VehicleReading>,
  ) {}

  /**
   * SPEC REQUIREMENT D: Analytical Endpoint
   * GET /analytics/performance/:vehicleId
   * Returns 24-hour summary for a specific vehicle
   */
  async getVehiclePerformance(vehicleId: string): Promise<VehiclePerformance> {
    // Use Luxon for clean time arithmetic
    const end = DateTime.now();
    const start = end.minus({ hours: 24 });

    // Get vehicle readings for last 24 hours
    const vehicleReadings = await this.vehicleReadingRepository.find({
      where: {
        vehicleId,
        timestamp: Between(start.toJSDate(), end.toJSDate()),
      },
      order: { timestamp: 'ASC' },
    });

    if (vehicleReadings.length === 0) {
      throw new NotFoundException(
        `No data found for vehicle ${vehicleId} in the last 24 hours`,
      );
    }

    // Extract unique charger IDs
    const chargerIds = [...new Set(vehicleReadings.map((r) => r.chargerId))];

    // Get meter readings only for chargers this vehicle used
    const meterReadings = await this.meterReadingRepository.find({
      where: chargerIds.map((chargerId) => ({
        chargerId,
        timestamp: Between(start.toJSDate(), end.toJSDate()),
      })),
      order: { timestamp: 'ASC' },
    });

    // Calculate totals
    const totalEnergyDeliveredDc = vehicleReadings.reduce(
      (sum, r) => sum + Number(r.kwhDeliveredDc || 0),
      0,
    );
    const totalEnergyConsumedAc = meterReadings.reduce(
      (sum, r) => sum + Number(r.kwhConsumedAc || 0),
      0,
    );
    const avgBatteryTemperature =
      vehicleReadings.reduce((sum, r) => sum + Number(r.batteryTemp || 0), 0) /
      vehicleReadings.length;

    // Calculate efficiency ratio (DC/AC)
    const efficiencyRatio =
      totalEnergyConsumedAc > 0
        ? totalEnergyDeliveredDc / totalEnergyConsumedAc
        : 0;

    return {
      vehicleId,
      timeRange: { start: start.toJSDate(), end: end.toJSDate() },
      totalEnergyConsumedAc: round(totalEnergyConsumedAc, 3),
      totalEnergyDeliveredDc: round(totalEnergyDeliveredDc, 3),
      efficiencyRatio: round(efficiencyRatio, 3),
      avgBatteryTemperature: round(avgBatteryTemperature, 2),
      dataPoints: vehicleReadings.length + meterReadings.length,
    };
  }
}
