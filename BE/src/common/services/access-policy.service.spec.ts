import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService instructor ownership', () => {
  const examId = 'exam-1';
  const ownerId = 'lecturer-owner';
  const otherId = 'lecturer-other';

  const buildService = (exam: any) => {
    const prisma = {
      exam: {
        findUnique: jest.fn().mockResolvedValue(exam),
      },
    };
    return {
      service: new AccessPolicyService(prisma as any),
      prisma,
    };
  };

  it('allows admin to access any existing exam', async () => {
    const { service } = buildService({
      id: examId,
      creatorId: otherId,
      course: { lecturerId: otherId },
    });

    await expect(
      service.assertInstructorCanAccessExam(examId, { id: 'admin-1', role: 'ADMIN' }),
    ).resolves.toMatchObject({ id: examId });
  });

  it('allows the lecturer assigned to the course', async () => {
    const { service } = buildService({
      id: examId,
      creatorId: otherId,
      course: { lecturerId: ownerId },
    });

    await expect(
      service.assertInstructorCanAccessExam(examId, { id: ownerId, role: 'LECTURER' }),
    ).resolves.toMatchObject({ id: examId });
  });

  it('blocks a lecturer from another course', async () => {
    const { service } = buildService({
      id: examId,
      creatorId: ownerId,
      course: { lecturerId: ownerId },
    });

    await expect(
      service.assertInstructorCanAccessExam(examId, { id: otherId, role: 'LECTURER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns not found for a missing exam', async () => {
    const { service } = buildService(null);

    await expect(
      service.assertInstructorCanAccessExam(examId, { id: ownerId, role: 'LECTURER' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
