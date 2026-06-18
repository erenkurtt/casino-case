import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { GetSpinHistoryQueryDto } from './dto/get-spin-history-query.dto';
import { SpinDto } from './dto/spin.dto';
import { SlotService } from './slot.service';

@ApiTags('Slot Machine')
@Controller('slot')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @ApiOperation({ summary: 'Get available slot bet options' })
  @ApiOkResponse({ description: 'Bet options returned successfully' })
  @Get('bet-options')
  getBetOptions() {
    return this.slotService.getBetOptions();
  }

  @ApiOperation({ summary: 'Spin the slot machine' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Spin completed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid bet amount or insufficient balance',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiNotFoundResponse({ description: 'Game not found' })
  @Post('spin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  spin(@CurrentUser() user: JwtPayload, @Body() dto: SpinDto) {
    return this.slotService.spin(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get authenticated user spin history' })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Spin history returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetSpinHistoryQueryDto,
  ) {
    return this.slotService.getHistory(user.sub, query);
  }
}