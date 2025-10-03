import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty()
  @IsString()
  productId: string;
}

export class RemoveFavoriteDto {
  @ApiProperty()
  @IsString()
  productId: string;
}
