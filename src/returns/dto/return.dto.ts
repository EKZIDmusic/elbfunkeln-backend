import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReturnDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsString()
  description: string;
}

export class UpdateReturnDto {
  @ApiProperty()
  @IsEnum(['pending', 'approved', 'rejected', 'completed'])
  status: string;
}
