import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleReading } from './entities/vehicle-reading.entity';
import { VehicleCurrentStatus } from './entities/vehicle-current-status.entity';
import { CreateVehicleReadingDto } from './dto/create-vehicle-reading.dto';

@Injectable()
export class VehicleReadingsService {
  constructor(
    @InjectRepository(VehicleReading)
    private readonly vehicleReadingRepository: Repository<VehicleReading>,
    @InjectRepository(VehicleCurrentStatus)
    private readonly vehicleStatusRepository: Repository<VehicleCurrentStatus>,
  ) {}

  async create(
    createReadingDto: CreateVehicleReadingDto,
  ): Promise<VehicleReading> {
    const timestamp = new Date(createReadingDto.timestamp);

    // COLD DATA PATH: INSERT - Append to historical store (audit trail)
    const reading = this.vehicleReadingRepository.create({
      vehicleId: createReadingDto.vehicleId,
      chargerId: createReadingDto.chargerId,
      soc: createReadingDto.soc,
      kwhDeliveredDc: createReadingDto.kwhDeliveredDc,
      batteryTemp: createReadingDto.batteryTemp,
      timestamp,
    });
    const savedReading = await this.vehicleReadingRepository.save(reading);

    // HOT DATA PATH: UPSERT - Update current status for fast dashboard access
    await this.vehicleStatusRepository.upsert(
      {
        vehicleId: createReadingDto.vehicleId,
        chargerId: createReadingDto.chargerId,
        soc: createReadingDto.soc,
        kwhDeliveredDc: createReadingDto.kwhDeliveredDc,
        batteryTemp: createReadingDto.batteryTemp,
        timestamp,
      },
      ['vehicleId'], // Conflict target - primary key
    );

    return savedReading;
  }

  // HOT DATA: Get all current statuses
  async getAllCurrentStatuses(): Promise<VehicleCurrentStatus[]> {
    return await this.vehicleStatusRepository.find({
      order: { timestamp: 'DESC' },
    });
  }
}
