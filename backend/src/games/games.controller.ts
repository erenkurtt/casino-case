import { Controller, Get, Header, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { GetGamesQueryDto } from './dto/get-games-query.dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @ApiOperation({
    summary: 'List games with search, filter, pagination and sorting',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'fire' })
  @ApiQuery({ name: 'providerName', required: false, example: 'BGaming' })
  @ApiQuery({ name: 'country', required: false, example: 'TR' })
  @ApiQuery({ name: 'gameType', required: false, example: 'slot' })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'providerName'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiOkResponse({ description: 'Games returned successfully' })
  @Get()
  @Header('Cache-Control', 'public, max-age=30')
  findAll(@Query() query: GetGamesQueryDto) {
    return this.gamesService.findAll(query);
  }
}