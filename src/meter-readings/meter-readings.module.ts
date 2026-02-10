import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReadingsService } from './meter-readings.service';
import { MeterReadingsController } from './meter-readings.controller';
import { MeterReading } from './entities/meter-reading.entity';
import { ChargerCurrentStatus } from './entities/charger-current-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeterReading, ChargerCurrentStatus])],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService],
  exports: [MeterReadingsService, TypeOrmModule],
})
export class MeterReadingsModule {}
