import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UsersService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(createUserDto: CreateUserDto): Promise<any>;
    findAll(role?: string, status?: string, search?: string, pagination?: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    findOne(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getStudents(): Promise<any>;
    getLecturers(): Promise<any>;
}
