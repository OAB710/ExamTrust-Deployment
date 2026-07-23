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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const perf_log_1 = require("../common/utils/perf-log");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const startedAt = (0, perf_log_1.nowMs)();
        const parts = {};
        const user = await (0, perf_log_1.measurePerf)('findUser', () => this.prisma.user.findUnique({
            where: { email: loginDto.email },
        }), parts);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const isPasswordValid = await (0, perf_log_1.measurePerf)('passwordCompare', () => bcrypt.compare(loginDto.password, user.password), parts);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await (0, perf_log_1.measurePerf)('jwtSign', async () => this.jwtService.sign(payload), parts);
        (0, perf_log_1.logPerf)(`AuthService.login total=${(0, perf_log_1.elapsedMs)(startedAt)}ms ` +
            Object.entries(parts)
                .map(([key, value]) => `${key}=${value}ms`)
                .join(' '));
        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                avatar: user.avatar,
            },
        };
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                fullName: registerDto.fullName,
                role: registerDto.role || 'STUDENT',
                studentId: registerDto.studentId,
                department: registerDto.department,
            },
        });
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
            },
        };
    }
    async validateUser(userId) {
        return this.prisma.user.findFirst({
            where: {
                id: userId,
                status: 'active',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                studentId: true,
                department: true,
                avatar: true,
                status: true,
            },
        });
    }
    async getProfile(userId) {
        const user = await this.validateUser(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return user;
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!user || user.status !== 'active') {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
            const emailInUse = await this.prisma.user.findUnique({
                where: { email: updateProfileDto.email },
            });
            if (emailInUse) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        const data = {
            email: updateProfileDto.email,
            fullName: updateProfileDto.fullName,
            department: updateProfileDto.department,
        };
        if (user.role === 'STUDENT') {
            data.studentId = updateProfileDto.studentId;
        }
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                studentId: true,
                department: true,
                avatar: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true, status: true },
        });
        if (!user || user.status !== 'active') {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const isSameAsCurrent = await bcrypt.compare(changePasswordDto.newPassword, user.password);
        if (isSameAsCurrent) {
            throw new common_1.ConflictException('New password must be different from current password');
        }
        const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: newHashedPassword },
        });
        return { message: 'Password updated successfully' };
    }
    async deleteProfile(userId, deleteProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true, status: true },
        });
        if (!user || user.status !== 'active') {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const isCurrentPasswordValid = await bcrypt.compare(deleteProfileDto.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'deleted' },
        });
        return { message: 'Profile deleted successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map