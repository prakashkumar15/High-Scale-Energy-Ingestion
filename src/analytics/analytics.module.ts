import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MeterReading } from '../meter-readings/entities/meter-reading.entity';
import { VehicleReading } from '../vehicle-readings/entities/vehicle-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeterReading, VehicleReading])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
