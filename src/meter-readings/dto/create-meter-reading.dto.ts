import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateMeterReadingDto {
  @IsNotEmpty()
  @IsString()
  meterId!: string;

  @IsNotEmpty()
  @IsNumber()
  kwhConsumedAc!: number;

  @IsNotEmpty()
  @IsNumber()
  voltage!: number;

  @IsNotEmpty()
  @IsDateString()
  timestamp!: string;
}
