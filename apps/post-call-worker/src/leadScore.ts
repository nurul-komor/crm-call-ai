import { Parser } from 'expr-eval';

export interface ScoringRule {
  /** Boolean expression evaluated against extractedData. e.g. "budget > 1000". */
  when: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  qualification: 'cold' | 'warm' | 'hot';
}

const parser = new Parser({
  operators: {
    add: true,
    concatenate: false,
    conditional: true,
    divide: true,
    factorial: false,
    multiply: true,
    power: false,
    remainder: true,
    subtract: true,
    logical: true,
    comparison: true,
    in: true,
    assignment: false,
  },
});

export function score(
  extracted: Record<string, unknown>,
  rules: ScoringRule[],
): ScoreResult {
  let total = 0;
  for (const rule of rules) {
    try {
      const expr = parser.parse(rule.when);
      const result = expr.evaluate(extracted as never);
      if (result === true || (typeof result === 'number' && result > 0)) {
        total += rule.points;
      }
    } catch {
      // Skip rules that don't evaluate (missing data, bad expression)
    }
  }
  const clamped = Math.max(0, Math.min(100, total));
  return { score: clamped, qualification: bucket(clamped) };
}

function bucket(n: number): 'cold' | 'warm' | 'hot' {
  if (n >= 71) return 'hot';
  if (n >= 31) return 'warm';
  return 'cold';
}
