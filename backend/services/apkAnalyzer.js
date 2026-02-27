const AdmZip = require('adm-zip');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// -------------------------------------------------------
// Dangerous Android Permissions List (OWASP + Google)
// -------------------------------------------------------
const DANGEROUS_PERMISSIONS = [
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
    'android.permission.READ_CALL_LOG',
    'android.permission.WRITE_CALL_LOG',
    'android.permission.PROCESS_OUTGOING_CALLS',
    'android.permission.READ_SMS',
    'android.permission.SEND_SMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.RECEIVE_MMS',
    'android.permission.READ_PHONE_STATE',
    'android.permission.CALL_PHONE',
    'android.permission.RECORD_AUDIO',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.GET_ACCOUNTS',
    'android.permission.USE_BIOMETRIC',
    'android.permission.USE_FINGERPRINT',
    'android.permission.BIND_DEVICE_ADMIN',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.WRITE_SETTINGS',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.REQUEST_INSTALL_PACKAGES',
    'android.permission.CHANGE_NETWORK_STATE',
];

// Suspicious API call patterns
const SUSPICIOUS_APIS = [
    'getDeviceId', 'getImei', 'getSubscriberId', 'getLine1Number',
    'getAllNetworkInfo', 'sendTextMessage', 'sendMultipartTextMessage',
    'execShell', 'Runtime.exec', 'ProcessBuilder',
    'Cipher.getInstance', 'getPassword', 'getAccounts',
    'loadUrl', 'addJavascriptInterface',
    'DexClassLoader', 'PathClassLoader', 'loadClass',
    'TelephonyManager', 'SmsManager', 'AudioRecord',
    'MediaRecorder', 'KeyStore', 'SecretKeyFactory',
    'getContactsStrings', 'getCallLog', 'getLocation',
    'Ljava/net/URL;->openConnection', 'Landroid/webkit/WebView;->loadUrl',
    'Ljava/lang/Runtime;->exec', 'Ljava/lang/reflect/Method;->invoke',
    'Ljavax/crypto/Cipher;->doFinal', 'Landroid/content/Context;->startService',
    'Landroid/content/Context;->bindService', 'Landroid/content/Intent;->setDataAndType'
];

const SENSITIVE_PATTERNS = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'Generic API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
    { name: 'Firebase URL', regex: /[a-z0-9.-]+\.firebaseio\.com/gi },
    { name: 'S3 Bucket', regex: /[a-z0-9.-]+\.s3\.amazonaws\.com/gi },
    { name: 'Slack Webhook', regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/g },
    { name: 'IP Address', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

// -------------------------------------------------------
// Main APK Analysis Function
// -------------------------------------------------------
async function analyzeApk(filePath) {
    const result = {
        fileName: path.basename(filePath),
        fileHash: '',
        fileSizeKb: 0,
        permissions: [],
        dangerousPermissionCount: 0,
        malwareMatch: false,
        malwareName: null,
        embeddedUrls: [],
        suspiciousApis: [],
        sensitiveData: [],
        rawManifest: '',
        error: null
    };

    try {
        // File size
        const stats = fs.statSync(filePath);
        result.fileSizeKb = Math.round(stats.size / 1024);

        // SHA-256 hash
        const fileBuffer = fs.readFileSync(filePath);
        result.fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Try to open as ZIP (APK is a ZIP)
        let zip;
        try {
            zip = new AdmZip(filePath);
        } catch (e) {
            result.error = 'Invalid APK file (not a valid ZIP archive)';
            return result;
        }

        const entries = zip.getEntries();

        // 1) Extract and parse AndroidManifest.xml
        const manifestEntry = entries.find(e => e.entryName === 'AndroidManifest.xml');
        if (manifestEntry) {
            try {
                const manifestBuf = manifestEntry.getData();
                // Android manifests are encoded as Android Binary XML (AXML)
                // We will extract readable strings from the binary
                const manifestStr = manifestBuf.toString('utf-8', 0, Math.min(manifestBuf.length, 100000));
                result.rawManifest = manifestStr;

                // Extract permissions from binary manifest using regex on readable parts
                const permissionMatches = [];
                const permRegex = /android\.permission\.[A-Z_]+/g;
                let match;
                const searchStr = manifestBuf.toString('binary');
                while ((match = permRegex.exec(searchStr)) !== null) {
                    const perm = match[0];
                    if (!permissionMatches.includes(perm)) {
                        permissionMatches.push(perm);
                    }
                }
                result.permissions = permissionMatches;
                result.dangerousPermissionCount = permissionMatches.filter(p =>
                    DANGEROUS_PERMISSIONS.includes(p)
                ).length;
            } catch (e) {
                result.permissions = [];
            }
        }

        // 2) Extract all string content from ZIP entries to find URLs and APIs
        const allStrings = [];
        for (const entry of entries) {
            if (entry.isDirectory) continue;
            const name = entry.entryName;

            // Scan DEX files, classes, assets for suspicious content
            if (name.endsWith('.dex') || name.endsWith('.smali') ||
                name.startsWith('assets/') || name.startsWith('res/') ||
                name.endsWith('.xml') || name.endsWith('.js') ||
                name.endsWith('.htm') || name.endsWith('.html')) {
                try {
                    const data = entry.getData();
                    if (data.length < 10_000_000) { // skip files >10MB
                        allStrings.push(data.toString('binary'));
                    }
                } catch (_) { }
            }
        }

        const combinedText = allStrings.join('\n');

        // 3) Extract embedded URLs
        const urlRegex = /https?:\/\/[^\s"'<>)(]{4,200}/g;
        const urlMatches = new Set();
        let urlMatch;
        while ((urlMatch = urlRegex.exec(combinedText)) !== null) {
            const url = urlMatch[0].replace(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g, '').trim();
            if (url.length > 8 && !url.includes('schemas.android') &&
                !url.includes('ns.adobe') && !url.includes('apache.org') &&
                !url.includes('w3.org') && !url.includes('google.com/tools') &&
                !url.includes('google.com/apk') && !url.includes('example.com')) {
                urlMatches.add(url);
            }
        }
        result.embeddedUrls = [...urlMatches].slice(0, 50);

        // 4) Detect suspicious API calls
        const foundApis = SUSPICIOUS_APIS.filter(api => combinedText.includes(api));
        result.suspiciousApis = foundApis;

        // 5) Detect sensitive strings
        const sensitiveMatches = [];
        SENSITIVE_PATTERNS.forEach(pattern => {
            let match;
            pattern.regex.lastIndex = 0; // reset regex state
            while ((match = pattern.regex.exec(combinedText)) !== null) {
                sensitiveMatches.push({ type: pattern.name, value: match[0] });
            }
        });
        result.sensitiveData = sensitiveMatches.slice(0, 20);

    } catch (err) {
        result.error = `Analysis failed: ${err.message}`;
        console.error('APK analysis error:', err);
    }

    return result;
}

module.exports = { analyzeApk, DANGEROUS_PERMISSIONS, SUSPICIOUS_APIS };
