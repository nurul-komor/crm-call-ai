import { describe, expect, it } from 'vitest';

import { score } from '../src/leadScore.js';

describe('leadScore', () => {
  it('sums points for matching rules and buckets into cold/warm/hot', () => {
    const rules = [
      { when: 'interested == true', points: 40 },
      { when: 'budget > 1000', points: 30 },
      { when: 'ready_days <= 30', points: 30 },
    ];
    expect(score({ interested: true, budget: 5000, ready_days: 7 }, rules)).toEqual({
      score: 100,
      qualification: 'hot',
    });
    expect(score({ interested: true, budget: 500 }, rules)).toEqual({
      score: 40,
      qualification: 'warm',
    });
    expect(score({ interested: false }, rules)).toEqual({
      score: 0,
      qualification: 'cold',
    });
  });

  it('clamps the total at 100', () => {
    const rules = [
      { when: 'a == 1', points: 60 },
      { when: 'b == 1', points: 60 },
    ];
    expect(score({ a: 1, b: 1 }, rules).score).toBe(100);
  });

  it('skips rules with missing variables instead of throwing', () => {
    const rules = [{ when: 'unknown > 0', points: 50 }];
    expect(score({}, rules)).toEqual({ score: 0, qualification: 'cold' });
  });

  it('boundaries: 31 = warm, 71 = hot, 30 = cold', () => {
    expect(score({ a: 1 }, [{ when: 'a == 1', points: 30 }]).qualification).toBe('cold');
    expect(score({ a: 1 }, [{ when: 'a == 1', points: 31 }]).qualification).toBe('warm');
    expect(score({ a: 1 }, [{ when: 'a == 1', points: 71 }]).qualification).toBe('hot');
  });
});
