import { SlotMachineService } from './slot-machine.service';

describe('SlotMachineService', () => {
  let service: SlotMachineService;

  beforeEach(() => {
    service = new SlotMachineService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return available bet options', () => {
    const result = service.getBetOptions();

    expect(result).toEqual({
      min: 0.5,
      max: 5,
      step: 0.5,
      options: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    });
  });

  it('should pay x50 for 3 cherries', () => {
    const result = service.calculateMultiplier([
      'cherry',
      'cherry',
      'cherry',
    ]);

    expect(result).toEqual({
      multiplier: 50,
      payoutRule: '3 cherries',
    });
  });

  it('should pay x40 for 2 cherries from left', () => {
    const result = service.calculateMultiplier([
      'cherry',
      'cherry',
      'lemon',
    ]);

    expect(result).toEqual({
      multiplier: 40,
      payoutRule: '2 cherries',
    });
  });

  it('should pay x20 for 3 apples', () => {
    const result = service.calculateMultiplier(['apple', 'apple', 'apple']);

    expect(result).toEqual({
      multiplier: 20,
      payoutRule: '3 apples',
    });
  });

  it('should pay x10 for 2 apples from left', () => {
    const result = service.calculateMultiplier(['apple', 'apple', 'cherry']);

    expect(result).toEqual({
      multiplier: 10,
      payoutRule: '2 apples',
    });
  });

  it('should pay x15 for 3 bananas', () => {
    const result = service.calculateMultiplier([
      'banana',
      'banana',
      'banana',
    ]);

    expect(result).toEqual({
      multiplier: 15,
      payoutRule: '3 bananas',
    });
  });

  it('should pay x5 for 2 bananas from left', () => {
    const result = service.calculateMultiplier([
      'banana',
      'banana',
      'apple',
    ]);

    expect(result).toEqual({
      multiplier: 5,
      payoutRule: '2 bananas',
    });
  });

  it('should pay x3 for 3 lemons', () => {
    const result = service.calculateMultiplier(['lemon', 'lemon', 'lemon']);

    expect(result).toEqual({
      multiplier: 3,
      payoutRule: '3 lemons',
    });
  });

  it('should not pay for 2 lemons', () => {
    const result = service.calculateMultiplier(['lemon', 'lemon', 'apple']);

    expect(result).toEqual({
      multiplier: 0,
      payoutRule: null,
    });
  });

  it('should not pay when same symbols are not consecutive from left', () => {
    const result = service.calculateMultiplier(['apple', 'cherry', 'apple']);

    expect(result).toEqual({
      multiplier: 0,
      payoutRule: null,
    });
  });

  it('should generate a valid spin result', () => {
    const result = service.spin();

    expect(result.reels).toHaveLength(3);
    expect(result.reels[0]).toMatch(/^(cherry|lemon|apple|banana)$/);
    expect(result.reels[1]).toMatch(/^(cherry|lemon|apple|banana)$/);
    expect(result.reels[2]).toMatch(/^(cherry|lemon|apple|banana)$/);
    expect(result).toHaveProperty('multiplier');
    expect(result).toHaveProperty('payoutRule');
  });
});