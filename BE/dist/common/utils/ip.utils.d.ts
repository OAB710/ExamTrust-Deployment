export declare function normalizeIp(raw?: string | null): string | null;
export declare function isIpInCidr(ipRaw: string | null, cidrRaw: string): boolean;
export declare function isIpInAnyCidr(ipRaw: string | null, cidrs: string[] | null | undefined): boolean;
export declare function isValidIpOrCidr(value: string): boolean;
