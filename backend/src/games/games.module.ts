import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { InMemoryCacheService } from '../common/cache/in-memory-cache.service';
import { RequestLoggerMiddleware } from '../common/middleware/request-logger.middleware';

@Module({
  controllers: [GamesController],
  providers: [GamesService, InMemoryCacheService],
})
export class GamesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes(GamesController);
  }
}