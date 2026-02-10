import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeterReadingsService } from './meter-readings.service';
import { CreateMeterReadingDto } from './dto/create-meter-reading.dto';

@Controller('meter-readings')
export class MeterReadingsController {
  constructor(private readonly readingsService: MeterReadingsService) {}

  // INGESTION ENDPOINT - Dual write to hot + cold storage
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReadingDto: CreateMeterReadingDto) {
    return this.readingsService.create(createReadingDto);
  }

  // HOT DATA - Current status (fast dashboard access)
  @Get('status')
  getAllCurrentStatuses() {
    return this.readingsService.getAllCurrentStatuses();
  }
}
