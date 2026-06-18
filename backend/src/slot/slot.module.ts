import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SlotController } from './slot.controller';
import { SlotMachineService } from './slot-machine.service';
import { SlotService } from './slot.service';

@Module({
  imports: [AuthModule],
  controllers: [SlotController],
  providers: [SlotService, SlotMachineService],
})
export class SlotModule {}