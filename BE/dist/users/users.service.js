"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const bcrypt = require("bcrypt");
const notifications_service_1 = require("../notifications/notifications.service");
let UsersService = class UsersService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(createUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = await this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
                status: createUserDto.status || 'active',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                studentId: true,
                department: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        try {
            await this.notificationsService.createMany([
                {
                    recipientId: createdUser.id,
                    kind: 'ACCOUNT_CREATED',
                    title: 'Account created',
                    message: 'Your account is ready. Please review your profile and start using the system.',
                    link: '/profile',
                    priority: 'normal',
                    metadata: { userId: createdUser.id, role: createdUser.role },
                },
            ]);
            await this.notificationsService.createForRole('ADMIN', {
                kind: 'USER_CREATED',
                title: 'New user created',
                message: `${createdUser.fullName} (${createdUser.role}) has been created.`,
                link: '/admin/users',
                priority: 'low',
                metadata: { userId: createdUser.id, role: createdUser.role },
            });
        }
        catch {
        }
        return createdUser;
    }
    async findAll(role, status, search, pagination) {
        const where = {};
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }
        else {
            where.status = { not: 'deleted' };
        }
        if (search) {
            where.OR = [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { studentId: { contains: search } },
                { department: { contains: search } },
            ];
        }
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    studentId: true,
                    department: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResult)(users, total, page, limit);
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                studentId: true,
                department: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                enrollments: {
                    include: {
                        course: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async update(id, updateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const emailInUse = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });
            if (emailInUse) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        const data = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                studentId: true,
                department: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        try {
            await this.notificationsService.create({
                recipientId: updatedUser.id,
                kind: 'ACCOUNT_UPDATED',
                title: 'Account updated',
                message: 'Your account profile or access settings were updated.',
                link: '/profile',
                priority: 'normal',
                metadata: {
                    userId: updatedUser.id,
                    roleChanged: user.role !== updatedUser.role,
                    statusChanged: user.status !== updatedUser.status,
                },
            });
            if (user.role !== updatedUser.role || user.status !== updatedUser.status) {
                await this.notificationsService.createForRole('ADMIN', {
                    kind: 'USER_ACCESS_UPDATED',
                    title: 'User role/status changed',
                    message: `${updatedUser.fullName}: ${user.role} -> ${updatedUser.role}, status ${user.status} -> ${updatedUser.status}.`,
                    link: '/admin/users',
                    priority: 'high',
                    metadata: { userId: updatedUser.id },
                });
            }
        }
        catch {
        }
        return updatedUser;
    }
    async remove(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id },
            data: { status: 'deleted' },
        });
        try {
            await this.notificationsService.createForRole('ADMIN', {
                kind: 'USER_ARCHIVED',
                title: 'User archived',
                message: `${user.fullName} has been archived.`,
                link: '/admin/users',
                priority: 'high',
                metadata: { userId: user.id },
            });
        }
        catch {
        }
        return { message: 'User archived successfully' };
    }
    async getStudents() {
        return this.prisma.user.findMany({
            where: {
                role: 'STUDENT',
                status: { not: 'deleted' },
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                studentId: true,
                department: true,
                status: true,
            },
        });
    }
    async getLecturers() {
        return this.prisma.user.findMany({
            where: {
                role: 'LECTURER',
                status: { not: 'deleted' },
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                department: true,
                status: true,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map