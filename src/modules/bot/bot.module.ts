import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { ProductsModule } from '../products/products.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ProductsModule, AiModule],
  providers: [BotService],
  controllers: [BotController],
})
export class BotModule {}
