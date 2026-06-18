import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import {
  ReelResult,
  SlotSpinResult,
  SlotSymbol,
} from './types/slot-symbol.type';

const REEL_1: SlotSymbol[] = [
  'cherry',
  'lemon',
  'apple',
  'lemon',
  'banana',
  'banana',
  'lemon',
  'lemon',
];

const REEL_2: SlotSymbol[] = [
  'lemon',
  'apple',
  'lemon',
  'lemon',
  'cherry',
  'apple',
  'banana',
  'lemon',
];

const REEL_3: SlotSymbol[] = [
  'lemon',
  'apple',
  'lemon',
  'apple',
  'cherry',
  'lemon',
  'banana',
  'lemon',
];

@Injectable()
export class SlotMachineService {
  getBetOptions() {
    return {
      min: 0.5,
      max: 5,
      step: 0.5,
      options: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    };
  }

  spin(): SlotSpinResult {
    const reels: ReelResult = [
      this.pickRandomSymbol(REEL_1),
      this.pickRandomSymbol(REEL_2),
      this.pickRandomSymbol(REEL_3),
    ];

    const { multiplier, payoutRule } = this.calculateMultiplier(reels);

    return {
      reels,
      multiplier,
      payoutRule,
    };
  }

  calculateMultiplier(reels: ReelResult): {
    multiplier: number;
    payoutRule: string | null;
  } {
    const [reel1, reel2, reel3] = reels;

    const isThreeInRow = reel1 === reel2 && reel2 === reel3;
    const isTwoFromLeft = reel1 === reel2;

    if (isThreeInRow) {
      switch (reel1) {
        case 'cherry':
          return { multiplier: 50, payoutRule: '3 cherries' };
        case 'apple':
          return { multiplier: 20, payoutRule: '3 apples' };
        case 'banana':
          return { multiplier: 15, payoutRule: '3 bananas' };
        case 'lemon':
          return { multiplier: 3, payoutRule: '3 lemons' };
      }
    }

    if (isTwoFromLeft) {
      switch (reel1) {
        case 'cherry':
          return { multiplier: 40, payoutRule: '2 cherries' };
        case 'apple':
          return { multiplier: 10, payoutRule: '2 apples' };
        case 'banana':
          return { multiplier: 5, payoutRule: '2 bananas' };
        case 'lemon':
          return { multiplier: 0, payoutRule: null };
      }
    }

    return {
      multiplier: 0,
      payoutRule: null,
    };
  }

  private pickRandomSymbol(reel: SlotSymbol[]): SlotSymbol {
    return reel[randomInt(0, reel.length)];
  }
}