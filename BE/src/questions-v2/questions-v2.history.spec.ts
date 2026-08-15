import { QuestionsService } from './questions-v2.service';

describe('QuestionsService question history analytics', () => {
  it('separates weighted version metrics from per-exam usage metrics', async () => {
    const prisma = {
      question: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'question-1',
            type: 'MULTIPLE_CHOICE',
            content: 'Question content',
            status: 'PUBLISHED',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            course: { id: 'course-1', code: 'CS101', name: 'Course' },
            versions: [
              {
                id: 'version-1', versionNo: 1, stem: 'Version one', aiGenerated: false,
                createdAt: new Date('2026-01-01T00:00:00.000Z'), metadata: null,
                statistics: { totalAttempts: 110, correctAttempts: 62, incorrectAttempts: 48, skippedAttempts: 0 },
              },
            ],
          },
        ]),
      },
      $queryRawUnsafe: jest.fn().mockResolvedValue([
        {
          questionVersionId: 'version-1', examId: 'exam-a', examTitle: 'Exam A',
          examStartTime: new Date('2026-02-01T00:00:00.000Z'), examCreatedAt: new Date('2026-01-20T00:00:00.000Z'),
          attempts: 10, students: 10, correctAttempts: 2, incorrectAttempts: 8, skippedAttempts: 0,
        },
        {
          questionVersionId: 'version-1', examId: 'exam-b', examTitle: 'Exam B',
          examStartTime: new Date('2026-02-08T00:00:00.000Z'), examCreatedAt: new Date('2026-01-20T00:00:00.000Z'),
          attempts: 100, students: 100, correctAttempts: 60, incorrectAttempts: 40, skippedAttempts: 0,
        },
      ]),
    };
    const service = new QuestionsService(prisma as any, {} as any, {} as any, {} as any);

    const result = await service.getQuestionHistory({}, { id: 'lecturer-1', role: 'LECTURER' });
    const row = result.data[0];

    expect(row.versionMetrics[0]).toMatchObject({
      versionId: 'version-1',
      attempts: 110,
      correctAttempts: 62,
      correctRate: 62 / 110,
      usageCount: 2,
    });
    expect(row.examUsageMetrics).toEqual([
      expect.objectContaining({ exam: 'Exam A', versionNo: 1, attempts: 10, correctRate: 0.2, students: 10 }),
      expect.objectContaining({ exam: 'Exam B', versionNo: 1, attempts: 100, correctRate: 0.6, students: 100 }),
    ]);
    expect(row.metrics).toEqual(row.versionMetrics);
  });
});
