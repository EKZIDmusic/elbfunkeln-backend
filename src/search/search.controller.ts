import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('Search')
@Controller('search')
@Public()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Search results' })
  searchProducts(@Query('q') query: string) {
    return this.searchService.searchProducts(query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved' })
  getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete search' })
  @ApiResponse({ status: 200, description: 'Autocomplete results' })
  autocomplete(@Query('q') query: string) {
    return this.searchService.autocomplete(query);
  }
}
