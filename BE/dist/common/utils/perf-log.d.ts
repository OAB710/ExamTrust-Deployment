export declare function isPerfLogEnabled(): boolean;
export declare function nowMs(): number;
export declare function elapsedMs(startMs: number): number;
export declare function measurePerf<T>(label: string, action: () => Promise<T>, parts?: Record<string, number>): Promise<T>;
export declare function logPerf(message: string): void;
