import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { MeterReadingsModule } from './meter-readings/meter-readings.module';
import { VehicleReadingsModule } from './vehicle-readings/vehicle-readings.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    MeterReadingsModule,
    VehicleReadingsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
