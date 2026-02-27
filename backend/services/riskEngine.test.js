const { computeRiskScore, classifyRisk, buildRiskBreakdown, RISK_WEIGHTS } = require('./riskEngine');

describe('Risk Engine', () => {
    test('computeRiskScore calculates correctly and caps at 100', () => {
        expect(computeRiskScore({ P: 2, M: 0, U: 1, A: 1 })).toBe(10 + 0 + 10 + 8); // 28
        expect(computeRiskScore({ P: 10, M: 1, U: 5, A: 5 })).toBe(100); // (50+40+50+40) = 180 -> 100
    });

    test('classifyRisk returns correct categories', () => {
        expect(classifyRisk(20)).toBe('Safe');
        expect(classifyRisk(30)).toBe('Safe');
        expect(classifyRisk(31)).toBe('Medium Risk');
        expect(classifyRisk(60)).toBe('Medium Risk');
        expect(classifyRisk(61)).toBe('High Risk');
        expect(classifyRisk(100)).toBe('High Risk');
    });

    test('buildRiskBreakdown returns detailed object', () => {
        const result = buildRiskBreakdown({ P: 1, M: 0, U: 2, A: 0 });
        expect(result.score).toBe(25);
        expect(result.classification).toBe('Safe');
        expect(result.breakdown.permissions.points).toBe(5);
        expect(result.breakdown.urls.count).toBe(2);
        expect(result.colorCode).toBe('green');
        expect(result.formula).toContain('R = (1×5) + (0×40) + (2×10) + (0×8) = 25');
    });
});
