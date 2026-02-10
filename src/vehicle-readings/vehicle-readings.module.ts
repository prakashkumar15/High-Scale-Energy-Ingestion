import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleReadingsService } from './vehicle-readings.service';
import { VehicleReadingsController } from './vehicle-readings.controller';
import { VehicleReading } from './entities/vehicle-reading.entity';
import { VehicleCurrentStatus } from './entities/vehicle-current-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleReading, VehicleCurrentStatus])],
  controllers: [VehicleReadingsController],
  providers: [VehicleReadingsService],
  exports: [VehicleReadingsService, TypeOrmModule],
})
export class VehicleReadingsModule {}
