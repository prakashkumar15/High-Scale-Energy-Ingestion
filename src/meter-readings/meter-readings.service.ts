import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter-reading.entity';
import { ChargerCurrentStatus } from './entities/charger-current-status.entity';
import { CreateMeterReadingDto } from './dto/create-meter-reading.dto';

@Injectable()
export class MeterReadingsService {
  constructor(
    @InjectRepository(MeterReading)
    private readonly meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(ChargerCurrentStatus)
    private readonly chargerStatusRepository: Repository<ChargerCurrentStatus>,
  ) {}

  async create(createReadingDto: CreateMeterReadingDto): Promise<MeterReading> {
    const timestamp = new Date(createReadingDto.timestamp);

    // COLD DATA PATH: INSERT - Append to historical store (audit trail)
    const reading = this.meterReadingRepository.create({
      chargerId: createReadingDto.meterId, // Use meterId as chargerId
      kwhConsumedAc: createReadingDto.kwhConsumedAc,
      voltage: createReadingDto.voltage,
      timestamp,
    });
    const savedReading = await this.meterReadingRepository.save(reading);

    // HOT DATA PATH: UPSERT - Update current status for fast dashboard access
    await this.chargerStatusRepository.upsert(
      {
        meterId: createReadingDto.meterId,
        kwhConsumedAc: createReadingDto.kwhConsumedAc,
        voltage: createReadingDto.voltage,
        timestamp,
      },
      ['meterId'], // Conflict target - primary key
    );

    return savedReading;
  }

  async getAllCurrentStatuses(): Promise<ChargerCurrentStatus[]> {
    return await this.chargerStatusRepository.find({
      order: { timestamp: 'DESC' },
    });
  }
}
