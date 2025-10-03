import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  statusCode: number;

  constructor(
    success: boolean,
    statusCode: number,
    data?: T,
    message?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    data: T,
    message?: string,
    statusCode = 200,
  ): ResponseDto<T> {
    return new ResponseDto(true, statusCode, data, message);
  }

  static error(message: string, statusCode = 500): ResponseDto {
    return new ResponseDto(false, statusCode, undefined, message);
  }
}

export class PaginatedResponseDto<T> extends ResponseDto<T[]> {
  @ApiProperty()
  meta: PaginationMetaDto;

  constructor(
    data: T[],
    meta: PaginationMetaDto,
    message?: string,
    statusCode = 200,
  ) {
    super(true, statusCode, data, message);
    this.meta = meta;
  }
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  hasNextPage?: boolean;

  @ApiPropertyOptional()
  hasPreviousPage?: boolean;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}
