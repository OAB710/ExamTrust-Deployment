import { PrismaService } from '../prisma/prisma.service';
import { LecturerAttentionResponseDto } from './dto/lecturer-attention-response.dto';
export declare class LecturerDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAttention(lecturerId: string): Promise<LecturerAttentionResponseDto>;
}
