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
    const aiService = { assessQuestionDuplicatePair: jest.fn(), suggestSimilarTopics: jest.fn() };
    return { service: new QuestionsService(prisma as any, {} as any, aiService as any, {} as any), prisma, aiService };
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
    expect(aiService.assessQuestionDuplicatePair).not.toHaveBeenCalled();
  });

  it('does not surface a lexical candidate when the AI verdict is DISTINCT', async () => {
    const { service, prisma, aiService } = createService();
    prisma.question.findMany.mockResolvedValue([
      { id: 'q1', type: 'MULTIPLE_CHOICE', content: 'Tình huống nào cần sử dụng kiến thức về Biến Động?', topicLinks: [], updatedAt: new Date() },
      { id: 'q2', type: 'MULTIPLE_CHOICE', content: 'Tình huống nào cần sử dụng kiến thức về Đổi mới?', topicLinks: [], updatedAt: new Date() },
    ]);
    aiService.assessQuestionDuplicatePair.mockResolvedValue({
      relation: 'DISTINCT', confidence: 0.96, reason: 'Hai câu kiểm tra hai khái niệm khác nhau.',
      diagnostics: { sameKnowledgePoint: false, sameCognitiveOperation: true, sameExpectedAnswer: false, differentWording: true },
    });

    const result = await service.checkDuplicateQuestions('course-1', { id: 'lecturer-1', role: 'LECTURER' });

    expect(result.pairs).toEqual([]);
    expect(aiService.assessQuestionDuplicatePair).toHaveBeenCalledTimes(1);
  });

  it('returns the AI semantic-duplicate verdict and diagnostics without using lexical score as the verdict', async () => {
    const { service, prisma, aiService } = createService();
    prisma.question.findMany.mockResolvedValue([
      { id: 'q1', type: 'MULTIPLE_CHOICE', content: 'Trong SQL, JOIN nào giữ tất cả các hàng từ bảng bên trái?', topicLinks: [{ topic: { name: 'SQL JOIN' } }], updatedAt: new Date() },
      { id: 'q2', type: 'MULTIPLE_CHOICE', content: 'Khi không có bản ghi tương ứng ở bảng phải, JOIN nào vẫn giữ bản ghi bảng trái?', topicLinks: [{ topic: { name: 'SQL JOIN' } }], updatedAt: new Date() },
    ]);
    aiService.assessQuestionDuplicatePair.mockResolvedValue({
      relation: 'SEMANTIC_DUPLICATE', confidence: 0.95, reason: 'Cùng kiểm tra hành vi LEFT JOIN và cùng đáp án kỳ vọng.',
      diagnostics: { sameKnowledgePoint: true, sameCognitiveOperation: true, sameExpectedAnswer: true, differentWording: true },
    });

    const result = await service.checkDuplicateQuestions('course-1', { id: 'lecturer-1', role: 'LECTURER' });

    expect(result.pairs).toEqual([expect.objectContaining({
      relation: 'SEMANTIC_DUPLICATE', similarityPercent: 95, matchMethod: 'AI',
      diagnostics: expect.objectContaining({ sameExpectedAnswer: true, differentWording: true }),
    })]);
    expect(aiService.suggestSimilarTopics).not.toHaveBeenCalled();
  });

  it('does not show a non-exact candidate when AI assessment is unavailable', async () => {
    const { service, prisma, aiService } = createService();
    prisma.question.findMany.mockResolvedValue([
      { id: 'q1', type: 'MULTIPLE_CHOICE', content: 'Khi nào nên sử dụng database index?', topicLinks: [], updatedAt: new Date() },
      { id: 'q2', type: 'MULTIPLE_CHOICE', content: 'Khi nào không nên sử dụng database index?', topicLinks: [], updatedAt: new Date() },
    ]);
    aiService.assessQuestionDuplicatePair.mockResolvedValue(null);

    await expect(service.checkDuplicateQuestions('course-1', { id: 'lecturer-1', role: 'LECTURER' }))
      .resolves.toEqual(expect.objectContaining({ pairs: [] }));
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
