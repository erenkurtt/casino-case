export type SlotSymbol = 'cherry' | 'lemon' | 'apple' | 'banana';

export type ReelResult = [SlotSymbol, SlotSymbol, SlotSymbol];

export type SlotSpinResult = {
  reels: ReelResult;
  multiplier: number;
  payoutRule: string | null;
};