const https = require('https');
const { URL } = require('url');

// Known malicious domain patterns (heuristic)
const SUSPICIOUS_DOMAINS = [
    /phishing/i, /malware/i, /virus/i, /hack/i, /crack/i,
    /free-download/i, /warez/i, /torrent.*apk/i,
    /apk-download/i, /apkpure.*pro/i,
];

const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.bid', '.win', '.loan'];
const SUSPICIOUS_PATTERNS = [
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // raw IP address
    /[a-z0-9]{20,}\.(com|net|org)/i,       // long random subdomain
    /bit\.ly|goo\.gl|tinyurl|t\.co/i,      // URL shorteners
    /[а-яёА-ЯЁ]/,                          // cyrillic lookalike domain
];

async function scanUrl(rawUrl) {
    const result = {
        url: rawUrl,
        isSafe: true,
        threatType: null,
        threatLevel: 'safe',
        details: {},
        checkedAt: new Date().toISOString(),
    };

    // Try Google Safe Browsing API first
    if (process.env.GOOGLE_SAFE_BROWSING_KEY) {
        try {
            const gsbResult = await checkGoogleSafeBrowsing(rawUrl);
            if (gsbResult.found) {
                result.isSafe = false;
                result.threatLevel = 'malicious';
                result.threatType = gsbResult.threatType;
                result.details.source = 'Google Safe Browsing';
                result.details.matchedThreat = gsbResult.threatType;
                return result;
            }
            result.details.googleSafeBrowsing = 'checked';
        } catch (e) {
            console.warn('Google Safe Browsing check failed:', e.message);
        }
    }

    // Heuristic analysis
    let parsedUrl;
    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        result.isSafe = false;
        result.threatLevel = 'suspicious';
        result.threatType = 'Invalid URL';
        return result;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const fullUrl = rawUrl.toLowerCase();

    // Check 1: HTTP (not HTTPS)
    if (parsedUrl.protocol === 'http:') {
        result.details.insecure = true;
    }

    // Check 2: Suspicious TLDs
    const suspiciousTld = SUSPICIOUS_TLDS.find(tld => hostname.endsWith(tld));
    if (suspiciousTld) {
        result.isSafe = false;
        result.threatLevel = 'suspicious';
        result.threatType = 'Suspicious TLD';
        result.details.suspiciousTld = suspiciousTld;
        return result;
    }

    // Check 3: Domain keyword patterns
    const suspiciousDomain = SUSPICIOUS_DOMAINS.find(rx => rx.test(hostname));
    if (suspiciousDomain) {
        result.isSafe = false;
        result.threatLevel = 'malicious';
        result.threatType = 'Malicious Domain Pattern';
        return result;
    }

    // Check 4: Raw IP address hosting
    if (SUSPICIOUS_PATTERNS[0].test(hostname)) {
        result.isSafe = false;
        result.threatLevel = 'suspicious';
        result.threatType = 'Direct IP Address URL';
        result.details.directIp = hostname;
        return result;
    }

    // Check 5: URL shorteners
    if (SUSPICIOUS_PATTERNS[2].test(hostname)) {
        result.threatLevel = 'suspicious';
        result.threatType = 'URL Shortener';
        result.details.shortener = true;
        // URL shorteners are suspicious but not necessarily malicious
        return result;
    }

    // Check 6: APK download from suspicious source
    if (fullUrl.includes('.apk') && !hostname.includes('google.com') && !hostname.includes('play.google')) {
        result.threatLevel = 'suspicious';
        result.threatType = 'Third-party APK Download';
        result.details.apkDownload = true;
    }

    result.details.heuristicScore = 0;
    return result;
}

async function checkGoogleSafeBrowsing(url) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
        const body = JSON.stringify({
            client: { clientId: 'cyberknights', clientVersion: '1.0.0' },
            threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                platformTypes: ['ANY_PLATFORM'],
                threatEntryTypes: ['URL'],
                threatEntries: [{ url }]
            }
        });

        const options = {
            hostname: 'safebrowsing.googleapis.com',
            path: `/v4/threatMatches:find?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.matches && parsed.matches.length > 0) {
                        resolve({ found: true, threatType: parsed.matches[0].threatType });
                    } else {
                        resolve({ found: false });
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(body);
        req.end();
    });
}

module.exports = { scanUrl };
