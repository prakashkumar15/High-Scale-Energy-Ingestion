import {
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreateVehicleReadingDto {
  @IsNotEmpty()
  @IsString()
  vehicleId!: string;

  @IsNotEmpty()
  @IsString()
  chargerId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  soc!: number;

  @IsNotEmpty()
  @IsNumber()
  kwhDeliveredDc!: number;

  @IsNotEmpty()
  @IsNumber()
  batteryTemp!: number;

  @IsNotEmpty()
  @IsDateString()
  timestamp!: string;
}
