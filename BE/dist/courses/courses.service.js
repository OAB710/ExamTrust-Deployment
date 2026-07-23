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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const notifications_service_1 = require("../notifications/notifications.service");
let CoursesService = class CoursesService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async assertLecturerExists(lecturerId) {
        const lecturer = await this.prisma.user.findUnique({
            where: { id: lecturerId },
            select: { id: true, role: true, status: true },
        });
        if (!lecturer || lecturer.role !== 'LECTURER' || lecturer.status !== 'active') {
            throw new common_1.BadRequestException('Assigned lecturer is invalid or inactive');
        }
    }
    async assertCanAccessCourse(courseId, courseLecturerId, user) {
        if (user.role === 'ADMIN')
            return;
        if (user.role === 'LECTURER') {
            if (courseLecturerId !== user.id) {
                throw new common_1.ForbiddenException('You are not allowed to access this course');
            }
            return;
        }
        if (user.role === 'STUDENT') {
            const isEnrolled = await this.prisma.enrollment.findFirst({
                where: {
                    studentId: user.id,
                    courseId,
                },
            });
            if (!isEnrolled) {
                throw new common_1.ForbiddenException('You are not allowed to access this course');
            }
            return;
        }
        throw new common_1.ForbiddenException('You are not allowed to access this course');
    }
    toAsciiUpper(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .toUpperCase();
    }
    buildToken(value, maxLength, fallback) {
        const compact = this.toAsciiUpper(value)
            .split(/\s+/)
            .filter(Boolean)
            .join('');
        return (compact.slice(0, maxLength) || fallback).toUpperCase();
    }
    async generateCourseCode(courseName, creatorId) {
        const creator = await this.prisma.user.findUnique({
            where: { id: creatorId },
            select: { fullName: true, email: true },
        });
        const courseToken = this.buildToken(courseName, 6, 'COURSE');
        const creatorToken = this.buildToken(creator?.fullName || creator?.email?.split('@')[0] || '', 4, 'USER');
        const base = `${courseToken}-${creatorToken}`;
        const existingCodes = await this.prisma.course.findMany({
            where: { code: { startsWith: `${base}-` } },
            select: { code: true },
        });
        const usedNumbers = new Set();
        for (const item of existingCodes) {
            const suffix = item.code.slice(base.length + 1);
            const parsed = Number.parseInt(suffix, 10);
            if (!Number.isNaN(parsed)) {
                usedNumbers.add(parsed);
            }
        }
        let sequence = 1;
        while (usedNumbers.has(sequence)) {
            sequence += 1;
        }
        return `${base}-${String(sequence).padStart(2, '0')}`;
    }
    async create(createCourseDto, user) {
        const { lecturerId: requestedLecturerId, ...courseData } = createCourseDto;
        const lecturerId = user.role === 'ADMIN' ? requestedLecturerId ?? null : user.id;
        const generatedCode = await this.generateCourseCode(createCourseDto.name, user.id);
        if (lecturerId) {
            await this.assertLecturerExists(lecturerId);
        }
        const createdCourse = await this.prisma.course.create({
            data: {
                ...courseData,
                code: generatedCode,
                lecturerId,
            },
            include: {
                lecturer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        try {
            const inputs = [];
            if (createdCourse.lecturer?.id) {
                inputs.push({
                    recipientId: createdCourse.lecturer.id,
                    kind: 'COURSE_ASSIGNED',
                    title: 'Course assigned',
                    message: `You are assigned to ${createdCourse.code} - ${createdCourse.name}.`,
                    link: '/lecturer/courses',
                    priority: 'normal',
                    metadata: { courseId: createdCourse.id },
                });
            }
            if (user.role === 'LECTURER') {
                inputs.push({
                    recipientId: user.id,
                    kind: 'COURSE_CREATED',
                    title: 'Course created',
                    message: `Your course ${createdCourse.code} - ${createdCourse.name} was created successfully.`,
                    link: '/lecturer/courses',
                    priority: 'low',
                    metadata: { courseId: createdCourse.id },
                });
            }
            const admins = await this.prisma.user.findMany({
                where: { role: 'ADMIN', status: { not: 'deleted' } },
                select: { id: true },
            });
            admins.forEach((admin) => {
                if (admin.id !== user.id) {
                    inputs.push({
                        recipientId: admin.id,
                        kind: 'COURSE_CREATED',
                        title: 'New course created',
                        message: `${createdCourse.code} - ${createdCourse.name} has been created.`,
                        link: '/admin/courses',
                        priority: 'low',
                        metadata: { courseId: createdCourse.id, createdBy: user.id },
                    });
                }
            });
            await this.notificationsService.createMany(inputs);
        }
        catch {
        }
        return createdCourse;
    }
    async findAll(lecturerId, pagination) {
        const where = lecturerId ? { lecturerId } : undefined;
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    lecturer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            exams: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.course.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResult)(courses, total, page, limit);
    }
    async findOne(id, user) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                lecturer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        department: true,
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                studentId: true,
                            },
                        },
                    },
                },
                exams: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        await this.assertCanAccessCourse(course.id, course.lecturerId, user);
        return course;
    }
    async update(id, updateCourseDto, user) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        await this.assertCanAccessCourse(course.id, course.lecturerId, user);
        const { lecturerId: requestedLecturerId, ...courseData } = updateCourseDto;
        if (requestedLecturerId !== undefined && user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only admin can re-assign course lecturer');
        }
        if (requestedLecturerId) {
            await this.assertLecturerExists(requestedLecturerId);
        }
        const data = {
            ...courseData,
            ...(user.role === 'ADMIN' && requestedLecturerId !== undefined ? { lecturerId: requestedLecturerId } : {}),
        };
        const updatedCourse = await this.prisma.course.update({
            where: { id },
            data,
            include: {
                lecturer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        try {
            const enrollments = await this.prisma.enrollment.findMany({
                where: { courseId: id },
                select: { studentId: true },
            });
            const recipientIds = Array.from(new Set([
                ...enrollments.map((e) => e.studentId),
                ...(updatedCourse.lecturer?.id ? [updatedCourse.lecturer.id] : []),
            ]));
            await this.notificationsService.createForUsers(recipientIds, {
                kind: 'COURSE_UPDATED',
                title: 'Course updated',
                message: `${updatedCourse.code} - ${updatedCourse.name} has new updates.`,
                link: user.role === 'ADMIN'
                    ? '/admin/courses'
                    : `/lecturer/course/${updatedCourse.id}`,
                priority: 'normal',
                metadata: { courseId: updatedCourse.id },
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.createForRole('ADMIN', {
                    kind: 'COURSE_UPDATED',
                    title: 'Course modified',
                    message: `${updatedCourse.code} - ${updatedCourse.name} was updated by lecturer.`,
                    link: '/admin/courses',
                    priority: 'low',
                    metadata: { courseId: updatedCourse.id, updatedBy: user.id },
                });
            }
        }
        catch {
        }
        return updatedCourse;
    }
    async remove(id, user) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        await this.assertCanAccessCourse(course.id, course.lecturerId, user);
        const impactedEnrollments = await this.prisma.enrollment.findMany({
            where: { courseId: id },
            select: { studentId: true },
        });
        const impactedUserIds = Array.from(new Set([
            ...impactedEnrollments.map((e) => e.studentId),
            ...(course.lecturerId ? [course.lecturerId] : []),
        ]));
        try {
            await this.prisma.course.delete({ where: { id } });
        }
        catch (error) {
            if (error?.code === 'P2003') {
                throw new common_1.ConflictException('Cannot delete course because it still has related data');
            }
            throw error;
        }
        try {
            await this.notificationsService.createForUsers(impactedUserIds, {
                kind: 'COURSE_DELETED',
                title: 'Course removed',
                message: `Course ${course.code} - ${course.name} has been removed from the system.`,
                link: user.role === 'ADMIN' ? '/admin/courses' : '/lecturer/courses',
                priority: 'high',
                metadata: { courseId: course.id },
            });
        }
        catch {
        }
        return { message: 'Course deleted successfully' };
    }
    async getMyCoursesAsStudent(studentId, limit) {
        const courses = await this.prisma.course.findMany({
            where: {
                enrollments: {
                    some: { studentId },
                },
            },
            include: {
                lecturer: {
                    select: { id: true, fullName: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        const courseIds = courses.map((course) => course.id);
        if (courseIds.length === 0)
            return [];
        const [enrollmentCounts, exams] = await Promise.all([
            this.prisma.enrollment.groupBy({
                by: ['courseId'],
                where: { courseId: { in: courseIds } },
                _count: { _all: true },
            }),
            this.prisma.exam.findMany({
                where: {
                    courseId: { in: courseIds },
                    status: { in: ['PUBLISHED', 'ONGOING', 'COMPLETED'] },
                },
                select: {
                    id: true,
                    courseId: true,
                    title: true,
                    status: true,
                    startTime: true,
                    endTime: true,
                    duration: true,
                    maxAttempts: true,
                    settings: true,
                },
                orderBy: [{ endTime: 'asc' }, { startTime: 'asc' }],
            }),
        ]);
        const examIds = exams.map((exam) => exam.id);
        const submissions = examIds.length
            ? await this.prisma.examSubmission.findMany({
                where: {
                    studentId,
                    examId: { in: examIds },
                },
                select: {
                    id: true,
                    examId: true,
                    status: true,
                    score: true,
                    attemptNo: true,
                    startedAt: true,
                    submittedAt: true,
                    createdAt: true,
                },
                orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }, { createdAt: 'desc' }],
            })
            : [];
        const enrollmentCountByCourseId = new Map(enrollmentCounts.map((item) => [item.courseId, item._count._all]));
        const latestSubmissionByExamId = new Map();
        for (const submission of submissions) {
            if (!latestSubmissionByExamId.has(submission.examId)) {
                latestSubmissionByExamId.set(submission.examId, submission);
            }
        }
        const examsByCourseId = new Map();
        for (const exam of exams) {
            const rows = examsByCourseId.get(exam.courseId) ?? [];
            rows.push({
                id: exam.id,
                title: exam.title,
                status: exam.status,
                startTime: exam.startTime,
                endTime: exam.endTime,
                duration: exam.duration,
                maxAttempts: exam.maxAttempts,
                settings: exam.settings,
                latestSubmission: latestSubmissionByExamId.get(exam.id) ?? null,
            });
            examsByCourseId.set(exam.courseId, rows);
        }
        return courses.map((course) => {
            const courseExams = examsByCourseId.get(course.id) ?? [];
            const latestSubmission = courseExams
                .map((exam) => exam.latestSubmission)
                .filter(Boolean)
                .sort((a, b) => {
                const aTime = new Date(a.submittedAt ?? a.startedAt ?? a.createdAt ?? 0).getTime();
                const bTime = new Date(b.submittedAt ?? b.startedAt ?? b.createdAt ?? 0).getTime();
                return bTime - aTime;
            })[0];
            const enrolledCount = enrollmentCountByCourseId.get(course.id) ?? 0;
            return {
                id: course.id,
                code: course.code,
                name: course.name,
                academicYear: course.academicYear,
                term: course.term,
                description: course.description,
                credits: course.credits,
                lecturer: course.lecturer,
                enrolledStudents: enrolledCount,
                totalStudents: enrolledCount,
                exams: courseExams,
                lastAccessed: latestSubmission
                    ? latestSubmission.submittedAt ?? latestSubmission.startedAt ?? latestSubmission.createdAt
                    : null,
            };
        });
    }
    async getMyCoursesAsLecturer(lecturerId) {
        const courses = await this.prisma.course.findMany({
            where: { lecturerId },
            orderBy: { createdAt: 'desc' },
        });
        const results = await Promise.all(courses.map(async (c) => {
            const [enrolledCount, publishedExamsCount, totalSubmissions, lastSubmission] = await Promise.all([
                this.prisma.enrollment.count({ where: { courseId: c.id } }),
                this.prisma.exam.count({ where: { courseId: c.id, status: 'PUBLISHED' } }),
                this.prisma.examSubmission.count({ where: { exam: { courseId: c.id, status: 'PUBLISHED' } } }),
                this.prisma.examSubmission.findFirst({
                    where: { exam: { courseId: c.id } },
                    orderBy: { submittedAt: 'desc' },
                    select: { submittedAt: true, startedAt: true, createdAt: true },
                }),
            ]);
            const progress = publishedExamsCount > 0 && enrolledCount > 0
                ? Math.round((totalSubmissions / (publishedExamsCount * Math.max(1, enrolledCount))) * 100)
                : 0;
            const lastAccessed = lastSubmission ? lastSubmission.submittedAt ?? lastSubmission.startedAt ?? lastSubmission.createdAt : null;
            return {
                id: c.id,
                code: c.code,
                name: c.name,
                academicYear: c.academicYear,
                term: c.term,
                description: c.description,
                credits: c.credits,
                lecturerId: c.lecturerId,
                enrolledStudents: enrolledCount,
                totalStudents: enrolledCount,
                progress,
                lastAccessed,
            };
        }));
        return results;
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map