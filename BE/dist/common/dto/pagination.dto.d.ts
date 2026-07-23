export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function buildPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
