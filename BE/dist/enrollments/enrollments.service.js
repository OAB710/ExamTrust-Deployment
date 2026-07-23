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
var EnrollmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const notifications_service_1 = require("../notifications/notifications.service");
let EnrollmentsService = EnrollmentsService_1 = class EnrollmentsService {
    assertCanManageCourse(courseLecturerId, user) {
        if (user.role === 'ADMIN')
            return;
        if (user.role !== 'LECTURER' || courseLecturerId !== user.id) {
            throw new common_1.ForbiddenException('You are not allowed to manage enrollments for this course');
        }
    }
    async assertCanManageCourseById(courseId, user) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, lecturerId: true },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        this.assertCanManageCourse(course.lecturerId, user);
        return course;
    }
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(EnrollmentsService_1.name);
    }
    async create(createEnrollmentDto, user) {
        const course = await this.prisma.course.findUnique({
            where: { id: createEnrollmentDto.courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        this.assertCanManageCourse(course.lecturerId, user);
        const student = await this.prisma.user.findUnique({
            where: { id: createEnrollmentDto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        if (student.role !== 'STUDENT') {
            throw new common_1.BadRequestException('User is not a student');
        }
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    studentId: createEnrollmentDto.studentId,
                    courseId: createEnrollmentDto.courseId,
                },
            },
        });
        if (existingEnrollment) {
            throw new common_1.ConflictException('Student already enrolled in this course');
        }
        const enrollment = await this.prisma.enrollment.create({
            data: createEnrollmentDto,
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        try {
            const inputs = [
                {
                    recipientId: enrollment.student.id,
                    kind: 'ENROLLMENT_CREATED',
                    title: 'Enrollment confirmed',
                    message: `You are enrolled in ${enrollment.course.code} - ${enrollment.course.name}.`,
                    link: `/student/course/${enrollment.course.id}`,
                    priority: 'normal',
                    metadata: { courseId: enrollment.course.id, enrollmentId: enrollment.id },
                },
            ];
            if (course.lecturerId) {
                inputs.push({
                    recipientId: course.lecturerId,
                    kind: 'ENROLLMENT_CREATED',
                    title: 'New student enrolled',
                    message: `${enrollment.student.fullName} joined ${enrollment.course.code}.`,
                    link: `/lecturer/course/${enrollment.course.id}`,
                    priority: 'low',
                    metadata: { courseId: enrollment.course.id, studentId: enrollment.student.id },
                });
            }
            await this.notificationsService.createMany(inputs);
        }
        catch {
        }
        return enrollment;
    }
    async bulkEnroll(bulkEnrollmentDto, user) {
        const { courseId, studentIds } = bulkEnrollmentDto;
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        this.assertCanManageCourse(course.lecturerId, user);
        const results = {
            success: [],
            failed: [],
        };
        for (const studentId of studentIds) {
            try {
                const student = await this.prisma.user.findUnique({
                    where: { id: studentId },
                });
                if (!student) {
                    results.failed.push({ studentId, reason: 'Student not found' });
                    continue;
                }
                if (student.role !== 'STUDENT') {
                    results.failed.push({ studentId, reason: 'User is not a student' });
                    continue;
                }
                const existingEnrollment = await this.prisma.enrollment.findUnique({
                    where: {
                        courseId_studentId: { studentId, courseId },
                    },
                });
                if (existingEnrollment) {
                    results.failed.push({ studentId, reason: 'Already enrolled' });
                    continue;
                }
                await this.prisma.enrollment.create({
                    data: { studentId, courseId },
                });
                results.success.push(studentId);
            }
            catch (error) {
                results.failed.push({ studentId, reason: 'Unknown error' });
            }
        }
        try {
            if (results.success.length > 0) {
                await this.notificationsService.createForUsers(results.success, {
                    kind: 'ENROLLMENT_CREATED',
                    title: 'Enrollment confirmed',
                    message: `You have been enrolled in ${course.code} - ${course.name}.`,
                    link: `/student/course/${course.id}`,
                    priority: 'normal',
                    metadata: { courseId: course.id },
                });
                if (course.lecturerId) {
                    await this.notificationsService.create({
                        recipientId: course.lecturerId,
                        kind: 'ENROLLMENT_BULK_CREATED',
                        title: 'Bulk enrollment completed',
                        message: `${results.success.length} student(s) were enrolled into ${course.code}.`,
                        link: `/lecturer/course/${course.id}`,
                        priority: 'normal',
                        metadata: {
                            courseId: course.id,
                            successCount: results.success.length,
                            failedCount: results.failed.length,
                        },
                    });
                }
            }
        }
        catch {
        }
        return results;
    }
    async bulkEnrollByEmails(dto, user) {
        const { courseId, emails } = dto;
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        this.assertCanManageCourse(course.lecturerId, user);
        const results = {
            success: [],
            failed: [],
            provisioned: 0,
        };
        for (const email of emails) {
            try {
                let student = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
                if (!student) {
                    const tempPassword = await bcrypt.hash('Examtrust@123', 10);
                    const emailPrefix = email.split('@')[0];
                    student = await this.prisma.user.create({
                        data: {
                            email: email.toLowerCase().trim(),
                            password: tempPassword,
                            fullName: emailPrefix,
                            role: 'STUDENT',
                        },
                    });
                    results.provisioned = (results.provisioned ?? 0) + 1;
                }
                if (student.role !== 'STUDENT') {
                    results.failed.push({ email, reason: 'User is not a student (role: ' + student.role + ')' });
                    continue;
                }
                const existing = await this.prisma.enrollment.findUnique({
                    where: { courseId_studentId: { studentId: student.id, courseId } },
                });
                if (existing) {
                    results.failed.push({ email, reason: 'Already enrolled' });
                    continue;
                }
                await this.prisma.enrollment.create({ data: { studentId: student.id, courseId } });
                results.success.push({ email, fullName: student.fullName, studentId: student.studentId });
            }
            catch (err) {
                this.logger.error(`Failed to enroll ${email}: ${err?.message}`);
                results.failed.push({ email, reason: err?.message ?? 'Unknown error' });
            }
        }
        try {
            const successEmails = new Set(results.success.map((s) => s.email.toLowerCase().trim()));
            if (successEmails.size > 0) {
                const successStudents = await this.prisma.user.findMany({
                    where: {
                        role: 'STUDENT',
                        email: { in: Array.from(successEmails) },
                    },
                    select: { id: true },
                });
                await this.notificationsService.createForUsers(successStudents.map((s) => s.id), {
                    kind: 'ENROLLMENT_CREATED',
                    title: 'Enrollment confirmed',
                    message: `You have been enrolled in ${course.code} - ${course.name}.`,
                    link: `/student/course/${course.id}`,
                    priority: 'normal',
                    metadata: { courseId: course.id },
                });
            }
            if (results.provisioned > 0) {
                await this.notificationsService.createForRole('ADMIN', {
                    kind: 'USER_AUTO_PROVISIONED',
                    title: 'Student accounts auto-provisioned',
                    message: `${results.provisioned} new student account(s) were created during email enrollment.`,
                    link: '/admin/users',
                    priority: 'normal',
                    metadata: { courseId: course.id, provisioned: results.provisioned },
                });
            }
        }
        catch {
        }
        return results;
    }
    async bulkImport(dto, user) {
        const { courseId, students } = dto;
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        this.assertCanManageCourse(course.lecturerId, user);
        const results = {
            success: [],
            failed: [],
            provisioned: 0,
            totalProcessed: students.length,
        };
        for (let i = 0; i < students.length; i++) {
            const row = students[i];
            const rowNum = i + 1;
            const email = (row.email || '').toLowerCase().trim();
            if (!email) {
                results.failed.push({ email: email || '(empty)', reason: 'Email is required', row: rowNum });
                continue;
            }
            try {
                let student = await this.prisma.user.findUnique({ where: { email } });
                if (!student) {
                    const tempPassword = await bcrypt.hash('Examtrust@123', 10);
                    const emailPrefix = email.split('@')[0];
                    student = await this.prisma.user.create({
                        data: {
                            email,
                            password: tempPassword,
                            fullName: row.fullName?.trim() || emailPrefix,
                            role: 'STUDENT',
                            studentId: row.studentId?.trim() || null,
                        },
                    });
                    results.provisioned++;
                }
                if (student.role !== 'STUDENT') {
                    results.failed.push({ email, reason: `User is not a student (role: ${student.role})`, row: rowNum });
                    continue;
                }
                const updateData = {};
                if (row.fullName?.trim() && (!student.fullName || student.fullName === email.split('@')[0])) {
                    updateData.fullName = row.fullName.trim();
                }
                if (row.studentId?.trim() && !student.studentId) {
                    updateData.studentId = row.studentId.trim();
                }
                if (Object.keys(updateData).length > 0) {
                    await this.prisma.user.update({ where: { id: student.id }, data: updateData });
                }
                const existing = await this.prisma.enrollment.findUnique({
                    where: { courseId_studentId: { studentId: student.id, courseId } },
                });
                if (existing) {
                    results.failed.push({ email, reason: 'Already enrolled in this course', row: rowNum });
                    continue;
                }
                await this.prisma.enrollment.create({ data: { studentId: student.id, courseId } });
                results.success.push({
                    email,
                    fullName: row.fullName?.trim() || student.fullName,
                    studentId: row.studentId?.trim() || student.studentId,
                    row: rowNum,
                });
            }
            catch (err) {
                this.logger.error(`Bulk import failed for ${email}: ${err?.message}`);
                results.failed.push({ email, reason: err?.message ?? 'Unknown error', row: rowNum });
            }
        }
        try {
            if (results.success.length > 0) {
                const successEmails = results.success.map((s) => s.email);
                const successStudents = await this.prisma.user.findMany({
                    where: { email: { in: successEmails }, role: 'STUDENT' },
                    select: { id: true },
                });
                await this.notificationsService.createForUsers(successStudents.map((s) => s.id), {
                    kind: 'ENROLLMENT_CREATED',
                    title: 'Enrollment confirmed',
                    message: `You have been enrolled in ${course.code} - ${course.name}.`,
                    link: `/student/course/${course.id}`,
                    priority: 'normal',
                    metadata: { courseId: course.id },
                });
                if (course.lecturerId) {
                    await this.notificationsService.create({
                        recipientId: course.lecturerId,
                        kind: 'ENROLLMENT_BULK_CREATED',
                        title: 'Bulk import completed',
                        message: `${results.success.length} student(s) imported into ${course.code}. ${results.failed.length} row(s) skipped.`,
                        link: `/lecturer/course/${course.id}`,
                        priority: 'normal',
                        metadata: {
                            courseId: course.id,
                            successCount: results.success.length,
                            failedCount: results.failed.length,
                            provisionedCount: results.provisioned,
                        },
                    });
                }
            }
            if (results.provisioned > 0) {
                await this.notificationsService.createForRole('ADMIN', {
                    kind: 'USER_AUTO_PROVISIONED',
                    title: 'Student accounts auto-provisioned',
                    message: `${results.provisioned} new student account(s) were created during bulk import into ${course.code}.`,
                    link: '/admin/users',
                    priority: 'normal',
                    metadata: { courseId: course.id, provisioned: results.provisioned },
                });
            }
        }
        catch {
        }
        return results;
    }
    async searchTrainingSystemStudents(query, courseId) {
        const trimmedQuery = String(query || '').trim();
        const normalizedQuery = trimmedQuery.toLowerCase();
        const alreadyEnrolled = courseId
            ? await this.prisma.enrollment.findMany({
                where: { courseId },
                select: { studentId: true },
            })
            : [];
        const excludedStudentIds = new Set(alreadyEnrolled.map((row) => row.studentId));
        const students = await this.prisma.user.findMany({
            where: {
                role: 'STUDENT',
                status: 'active',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                studentId: true,
                department: true,
            },
            orderBy: { fullName: 'asc' },
            take: 100,
        });
        return students.filter((student) => {
            if (excludedStudentIds.has(student.id)) {
                return false;
            }
            if (!normalizedQuery) {
                return true;
            }
            return [
                student.email,
                student.fullName,
                student.studentId,
                student.department,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery));
        });
    }
    async findByCourse(courseId, user) {
        await this.assertCanManageCourseById(courseId, user);
        return this.prisma.enrollment.findMany({
            where: { courseId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true,
                        department: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }
    async findByStudent(studentId) {
        return this.prisma.enrollment.findMany({
            where: { studentId },
            include: {
                course: {
                    include: {
                        lecturer: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }
    async updateStatus(id, updateStatusDto, user) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        lecturerId: true,
                    },
                },
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Enrollment not found');
        }
        this.assertCanManageCourse(enrollment.course.lecturerId, user);
        const updated = await this.prisma.enrollment.update({
            where: { id },
            data: { status: updateStatusDto.status },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        try {
            const course = await this.prisma.course.findUnique({
                where: { id: updated.course.id },
                select: { lecturerId: true },
            });
            const recipients = Array.from(new Set([
                updated.student.id,
                ...(course?.lecturerId ? [course.lecturerId] : []),
            ]));
            await this.notificationsService.createForUsers(recipients, {
                kind: 'ENROLLMENT_STATUS_CHANGED',
                title: 'Enrollment status updated',
                message: `Enrollment status for ${updated.course.code} is now ${updated.status}.`,
                link: `/student/course/${updated.course.id}`,
                priority: 'normal',
                metadata: { enrollmentId: updated.id, status: updated.status },
            });
        }
        catch {
        }
        return updated;
    }
    async remove(id, user) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, code: true, name: true, lecturerId: true },
                },
                student: {
                    select: { id: true, fullName: true },
                },
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Enrollment not found');
        }
        this.assertCanManageCourse(enrollment.course.lecturerId, user);
        await this.prisma.enrollment.delete({ where: { id } });
        try {
            await this.notificationsService.createForUsers([
                enrollment.student.id,
                ...(enrollment.course.lecturerId ? [enrollment.course.lecturerId] : []),
            ], {
                kind: 'ENROLLMENT_REMOVED',
                title: 'Enrollment removed',
                message: `${enrollment.student.fullName} is no longer enrolled in ${enrollment.course.code}.`,
                link: '/lecturer/courses',
                priority: 'high',
                metadata: { courseId: enrollment.course.id },
            });
        }
        catch {
        }
        return { message: 'Enrollment removed successfully' };
    }
    async removeByStudentAndCourse(studentId, courseId, user) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                courseId_studentId: { studentId, courseId },
            },
            include: {
                course: {
                    select: { id: true, code: true, lecturerId: true },
                },
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Enrollment not found');
        }
        this.assertCanManageCourse(enrollment.course.lecturerId, user);
        await this.prisma.enrollment.delete({
            where: { id: enrollment.id },
        });
        try {
            await this.notificationsService.createForUsers([
                studentId,
                ...(enrollment.course.lecturerId ? [enrollment.course.lecturerId] : []),
            ], {
                kind: 'ENROLLMENT_REMOVED',
                title: 'Enrollment removed',
                message: `Enrollment in ${enrollment.course.code} has been removed.`,
                link: '/student',
                priority: 'high',
                metadata: { courseId: enrollment.course.id },
            });
        }
        catch {
        }
        return { message: 'Enrollment removed successfully' };
    }
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = EnrollmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], EnrollmentsService);
//# sourceMappingURL=enrollments.service.js.map