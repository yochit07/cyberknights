/**
 * Cyber Knights Risk Engine
 * Formula: R = (P × 5) + (M × 40) + (U × 10) + (A × 8)
 * P = dangerous permissions count
 * M = malware signature match (0 or 1)
 * U = suspicious embedded URL count
 * A = suspicious API call count
 */

const RISK_WEIGHTS = {
    PERMISSION: 5,
    MALWARE: 40,
    URL: 10,
    API: 8,
};

const CLASSIFICATIONS = {
    SAFE: 'Safe',
    MEDIUM: 'Medium Risk',
    HIGH: 'High Risk',
};

function computeRiskScore({ P = 0, M = 0, U = 0, A = 0 }) {
    const score = (P * RISK_WEIGHTS.PERMISSION) +
        (M * RISK_WEIGHTS.MALWARE) +
        (U * RISK_WEIGHTS.URL) +
        (A * RISK_WEIGHTS.API);
    return Math.min(score, 100); // Cap at 100
}

function classifyRisk(score) {
    if (score <= 30) return CLASSIFICATIONS.SAFE;
    if (score <= 60) return CLASSIFICATIONS.MEDIUM;
    return CLASSIFICATIONS.HIGH;
}

function buildRiskBreakdown({ P = 0, M = 0, U = 0, A = 0 }) {
    const score = computeRiskScore({ P, M, U, A });
    const classification = classifyRisk(score);

    return {
        score,
        classification,
        breakdown: {
            permissions: { count: P, points: P * RISK_WEIGHTS.PERMISSION, weight: RISK_WEIGHTS.PERMISSION },
            malware: { match: M === 1, points: M * RISK_WEIGHTS.MALWARE, weight: RISK_WEIGHTS.MALWARE },
            urls: { count: U, points: U * RISK_WEIGHTS.URL, weight: RISK_WEIGHTS.URL },
            apis: { count: A, points: A * RISK_WEIGHTS.API, weight: RISK_WEIGHTS.API },
        },
        formula: `R = (${P}×${RISK_WEIGHTS.PERMISSION}) + (${M}×${RISK_WEIGHTS.MALWARE}) + (${U}×${RISK_WEIGHTS.URL}) + (${A}×${RISK_WEIGHTS.API}) = ${score}`,
        colorCode: classification === CLASSIFICATIONS.SAFE ? 'green' :
            classification === CLASSIFICATIONS.MEDIUM ? 'yellow' : 'red',
    };
}

module.exports = { computeRiskScore, classifyRisk, buildRiskBreakdown, RISK_WEIGHTS };
