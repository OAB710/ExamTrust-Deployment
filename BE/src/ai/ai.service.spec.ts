import { AiService } from './ai.service';

describe('AiService.generateExamQualityReview', () => {
  const questionStats = [
    {
      questionId: 'q1',
      questionVersionId: 'qv1',
      questionText: 'What is 2+2?',
      totalAttempts: 8,
      correctRate: 12.5,
      incorrectRate: 87.5,
      skipRate: 0,
      avgTimeSeconds: 40,
      difficultyIndex: 0.9,
      discriminationIndex: -0.2,
    },
  ];

  const examSummary = { totalSubmissions: 8, avgScorePct: 55, passRate: 40, completionRate: 80 };

  const buildConfigService = (values: Record<string, string>) => ({
    get: (key: string) => values[key],
  });

  const buildMockRedisService = () => ({
    getOrThrow: () => ({ get: async () => null, set: async () => 'OK' }),
  }) as any;

  describe('question generation language policy', () => {
    it('defaults question output to Vietnamese even when a caller locale is English', () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any, buildMockRedisService());
      expect((service as any).resolveQuestionOutputLanguage('Create a database indexing question')).toBe('vi');
    });

    it('uses English only when the lecturer explicitly requests it in the prompt', () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any, buildMockRedisService());
      expect((service as any).resolveQuestionOutputLanguage('Tạo 3 câu hỏi bằng tiếng Anh về SQL')).toBe('en');
      expect((service as any).resolveQuestionOutputLanguage('Generate two questions in English about SQL')).toBe('en');
    });
  });

  describe('success flow (mock provider)', () => {
    it('returns a well-formed overallSummary and suggestions array', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any, buildMockRedisService());

      const result = await service.generateExamQualityReview({
        examTitle: 'Midterm Exam',
        examSummary,
        questionStats,
        language: 'en',
      });

      expect(typeof result.overallSummary).toBe('string');
      expect(result.overallSummary.length).toBeGreaterThan(0);
      expect(Array.isArray(result.suggestions)).toBe(true);
      result.suggestions.forEach((s) => {
        expect(questionStats.some((q) => q.questionId === s.questionId)).toBe(true);
        expect(['high', 'medium', 'low']).toContain(s.severity);
      });
    });

    it('drops suggestions whose questionId is not part of the supplied stats', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any, buildMockRedisService());
      // Force a provider response with a hallucinated question id by monkey-patching the private caller.
      (service as any).provider = 'local';
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            overallSummary: 'Mixed quality overall.',
            suggestions: [
              { questionId: 'q1', severity: 'high', reasonSummary: 'r1', recommendation: 'rec1' },
              { questionId: 'does-not-exist', severity: 'high', reasonSummary: 'r2', recommendation: 'rec2' },
            ],
          }),
      }) as any;

      const result = await service.generateExamQualityReview({
        examTitle: 'Midterm Exam',
        examSummary,
        questionStats,
        language: 'en',
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].questionId).toBe('q1');
    });
  });

  describe('AI provider error', () => {
    it('throws a descriptive error when the provider request fails', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'local' }) as any, buildMockRedisService());
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'Service unavailable' }) as any;

      await expect(
        service.generateExamQualityReview({
          examTitle: 'Midterm Exam',
          examSummary,
          questionStats,
          language: 'en',
        }),
      ).rejects.toThrow('Tạo nội dung bằng AI thất bại');
    });

    it('throws a descriptive error when the provider returns invalid JSON', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'local' }) as any, buildMockRedisService());
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => 'not json at all' }) as any;

      await expect(
        service.generateExamQualityReview({
          examTitle: 'Midterm Exam',
          examSummary,
          questionStats,
          language: 'en',
        }),
      ).rejects.toThrow('Tạo nội dung bằng AI thất bại');
    });

    it('throws when the provider returns a JSON shape missing the required fields', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'local' }) as any, buildMockRedisService());
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ unexpected: true }),
      }) as any;

      await expect(
        service.generateExamQualityReview({
          examTitle: 'Midterm Exam',
          examSummary,
          questionStats,
          language: 'en',
        }),
      ).rejects.toThrow('Tạo nội dung bằng AI thất bại');
    });
  });

  describe('topic similarity classification', () => {
    const existingTopics = [
      { id: 'database', name: 'Cơ sở dữ liệu' },
      { id: 'normalization', name: 'Chuẩn hóa dữ liệu' },
      { id: 'sql', name: 'Ngôn ngữ SQL' },
      { id: 'indexing', name: 'Lập chỉ mục cơ sở dữ liệu' },
      { id: 'transactions', name: 'Giao dịch cơ sở dữ liệu' },
    ];
    const createLocalService = (matches: unknown) => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'local' }) as any, buildMockRedisService());
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ matches }) }) as any;
      return service;
    };
    const request = (service: AiService, topicName: string, topicDescription?: string) => service.suggestSimilarTopics({
      topicName,
      topicDescription,
      existingTopics,
      language: 'vi',
      context: {
        courseCode: 'CS301',
        courseName: 'Cơ sở dữ liệu',
        courseDescription: 'Mô hình dữ liệu, SQL, giao dịch và tối ưu truy vấn.',
      },
    });

    it('classifies the same name as DUPLICATE', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any, buildMockRedisService());
      const result = await request(service, 'Cơ sở dữ liệu');
      expect(result.matches).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Cơ sở dữ liệu', relation: 'DUPLICATE', matchMethod: 'LEXICAL' })]));
    });

    it.each([
      ['different wording for the same concept', 'Thiết kế lược đồ quan hệ', 'Chuẩn hóa dữ liệu', 'SAME_CONCEPT'],
      ['an existing broader topic', 'Chuẩn hóa dữ liệu', 'Cơ sở dữ liệu', 'PARENT_OF'],
      ['an existing narrower topic', 'Cơ sở dữ liệu', 'Lập chỉ mục cơ sở dữ liệu', 'CHILD_OF'],
      ['partially overlapping topics', 'Tối ưu truy vấn SQL', 'Ngôn ngữ SQL', 'OVERLAP'],
      ['only related topics', 'Giao dịch cơ sở dữ liệu', 'Ngôn ngữ SQL', 'RELATED'],
    ])('classifies %s with the fixed existing-to-proposed direction', async (_label, proposed, existingName, relation) => {
      const service = createLocalService([{ name: existingName, score: 0.88, relation, reason: 'Lý do học thuật bằng tiếng Việt.' }]);
      const result = await request(service, proposed);
      expect(result.matches).toEqual([expect.objectContaining({ name: existingName, relation, matchMethod: 'AI', reason: 'Lý do học thuật bằng tiếng Việt.' })]);
    });

    it('does not return DISTINCT topics in the usual suggestion list', async () => {
      const service = createLocalService([{ name: 'Giao dịch cơ sở dữ liệu', score: 0.9, relation: 'DISTINCT', reason: 'Khác phạm vi.' }]);
      const result = await request(service, 'Đồ thị có trọng số');
      expect(result.matches).toEqual([]);
    });

    it('marks the fallback as LEXICAL when the AI provider fails', async () => {
      const service = new AiService(buildConfigService({ AI_PROVIDER: 'local' }) as any, buildMockRedisService());
      (service as any).localUrl = 'http://fake-local-model';
      global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as any;
      const result = await request(service, 'Chuẩn hóa dữ liệu');
      expect(result.matches).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Chuẩn hóa dữ liệu', matchMethod: 'LEXICAL', relation: 'DUPLICATE' })]));
    });

    it('asks for Vietnamese reasons and drops topics not supplied by the course', async () => {
      const service = createLocalService([
        { name: 'Chủ đề không tồn tại', score: 0.99, relation: 'DUPLICATE', reason: 'Không được trả về.' },
        { name: 'Chuẩn hóa dữ liệu', score: 0.91, relation: 'SAME_CONCEPT', reason: 'Hai tên gọi cùng mô tả việc tổ chức lược đồ quan hệ.' },
      ]);
      const result = await request(service, 'Thiết kế lược đồ quan hệ', 'Các dạng chuẩn và phụ thuộc hàm.');
      expect(result.matches).toEqual([expect.objectContaining({ name: 'Chuẩn hóa dữ liệu', reason: 'Hai tên gọi cùng mô tả việc tổ chức lược đồ quan hệ.' })]);
      const prompt = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).prompt;
      expect(prompt).toContain('write every reason in Vietnamese');
    });
  });
});
