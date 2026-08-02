import { ForbiddenException } from '@nestjs/common';
import { QuestionsService } from './questions-v2.service';

describe('QuestionsService duplicate question checks', () => {
  const createService = (overrides: Record<string, unknown> = {}) => {
    const prisma = {
      course: { findUnique: jest.fn().mockResolvedValue({ id: 'course-1', lecturerId: 'lecturer-1' }) },
      question: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      ...overrides,
    };
    const aiService = { suggestSimilarTopics: jest.fn() };
    return { service: new QuestionsService(prisma as any, {} as any, aiService as any), prisma, aiService };
  };

  it('returns an exact 100% pair after normalizing question text', async () => {
    const { service, prisma, aiService } = createService();
    prisma.question.findMany.mockResolvedValue([
      { id: 'q1', type: 'MULTIPLE_CHOICE', content: 'Thủ đô Việt Nam là gì?', updatedAt: new Date() },
      { id: 'q2', type: 'MULTIPLE_CHOICE', content: 'thu do viet nam la gi', updatedAt: new Date() },
      { id: 'q3', type: 'ESSAY', content: 'Thủ đô Việt Nam là gì?', updatedAt: new Date() },
    ]);

    const result = await service.checkDuplicateQuestions('course-1', { id: 'lecturer-1', role: 'LECTURER' });

    expect(result.pairs).toEqual([expect.objectContaining({
      similarityPercent: 100,
      matchMethod: 'EXACT',
      questionA: expect.objectContaining({ id: 'q1' }),
      questionB: expect.objectContaining({ id: 'q2' }),
    })]);
    expect(aiService.suggestSimilarTopics).not.toHaveBeenCalled();
  });

  it('does not allow a lecturer to scan another lecturer course', async () => {
    const { service, prisma } = createService();
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', lecturerId: 'lecturer-2' });

    await expect(service.checkDuplicateQuestions('course-1', { id: 'lecturer-1', role: 'LECTURER' }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps the saved threshold bounded to 1 through 100', async () => {
    const { service, prisma } = createService();
    await expect(service.updateDuplicatePreference(180, { id: 'lecturer-1', role: 'LECTURER' }))
      .resolves.toEqual({ similarityThreshold: 100 });
    expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
  });
});
