import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { GetFavoritesQueryDto } from './dto/get-favorites-query.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: 'List authenticated user favorite games' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Favorite games returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetFavoritesQueryDto,
  ) {
    return this.favoritesService.findAll(user.sub, query);
  }

  @ApiOperation({ summary: 'Add a game to authenticated user favorites' })
  @ApiParam({
    name: 'gameId',
    example: 'b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234',
    description: 'Game UUID',
  })
  @ApiOkResponse({ description: 'Game added to favorites successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiNotFoundResponse({ description: 'Game not found' })
  @ApiConflictResponse({ description: 'Game is already in favorites' })
  @Post(':gameId')
  addFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('gameId', ParseUUIDPipe) gameId: string,
  ) {
    return this.favoritesService.addFavorite(user.sub, gameId);
  }

  @ApiOperation({ summary: 'Remove a game from authenticated user favorites' })
  @ApiParam({
    name: 'gameId',
    example: 'b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234',
    description: 'Game UUID',
  })
  @ApiOkResponse({ description: 'Game removed from favorites successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiNotFoundResponse({ description: 'Favorite game not found' })
  @Delete(':gameId')
  removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('gameId', ParseUUIDPipe) gameId: string,
  ) {
    return this.favoritesService.removeFavorite(user.sub, gameId);
  }
}