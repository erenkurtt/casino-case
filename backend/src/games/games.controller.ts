import { Controller, Get, Header, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { GetGamesQueryDto } from './dto/get-games-query.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=30')
  findAll(@Query() query: GetGamesQueryDto) {
    return this.gamesService.findAll(query);
  }
}