import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VehicleReadingsService } from './vehicle-readings.service';
import { CreateVehicleReadingDto } from './dto/create-vehicle-reading.dto';

@Controller('vehicle-readings')
export class VehicleReadingsController {
  constructor(private readonly readingsService: VehicleReadingsService) {}

  // INGESTION ENDPOINT - Dual write to hot + cold storage
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReadingDto: CreateVehicleReadingDto) {
    return this.readingsService.create(createReadingDto);
  }

  // HOT DATA - Current status (fast dashboard access)
  @Get('status')
  getAllCurrentStatuses() {
    return this.readingsService.getAllCurrentStatuses();
  }
}
