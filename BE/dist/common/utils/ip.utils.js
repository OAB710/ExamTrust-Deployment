"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIp = normalizeIp;
exports.isIpInCidr = isIpInCidr;
exports.isIpInAnyCidr = isIpInAnyCidr;
exports.isValidIpOrCidr = isValidIpOrCidr;
function normalizeIp(raw) {
    if (!raw)
        return null;
    const first = String(raw).split(',')[0].trim();
    const noPort = first.split(':').length > 4 && first.includes(']:') ? first.split(']:')[0].replace('[', '') : first.split(':')[0];
    if (first.includes('::ffff:')) {
        return first.split('::ffff:').pop() || null;
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(noPort))
        return noPort;
    if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(first))
        return first.split(':')[0];
    return first;
}
function ipToLong(ip) {
    const parts = ip.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        throw new Error('Not IPv4');
    }
    return (((parts[0] << 24) >>> 0) +
        ((parts[1] << 16) >>> 0) +
        ((parts[2] << 8) >>> 0) +
        (parts[3] >>> 0)) >>> 0;
}
function isIpInCidr(ipRaw, cidrRaw) {
    if (!ipRaw)
        return false;
    const ip = normalizeIp(ipRaw);
    if (!ip)
        return false;
    const cidr = String(cidrRaw).trim();
    let base = cidr;
    let prefix = 32;
    if (cidr.includes('/')) {
        const parts = cidr.split('/');
        base = parts[0];
        prefix = Number(parts[1]);
    }
    try {
        const ipLong = ipToLong(ip);
        const baseLong = ipToLong(normalizeIp(base) || '0.0.0.0');
        if (prefix === 32) {
            return ipLong === baseLong;
        }
        const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
        return (ipLong & mask) === (baseLong & mask);
    }
    catch (e) {
        return false;
    }
}
function isIpInAnyCidr(ipRaw, cidrs) {
    if (!cidrs || cidrs.length === 0)
        return true;
    for (const c of cidrs) {
        if (isIpInCidr(ipRaw, c))
            return true;
    }
    return false;
}
function isValidIpOrCidr(value) {
    const raw = String(value || '').trim();
    if (!raw)
        return false;
    const [base, prefixRaw] = raw.split('/');
    const normalizedBase = normalizeIp(base);
    if (!normalizedBase || !/^\d+\.\d+\.\d+\.\d+$/.test(normalizedBase))
        return false;
    const parts = normalizedBase.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255))
        return false;
    if (typeof prefixRaw === 'undefined')
        return true;
    if (!/^\d+$/.test(prefixRaw))
        return false;
    const prefix = Number(prefixRaw);
    return prefix >= 0 && prefix <= 32;
}
//# sourceMappingURL=ip.utils.js.map