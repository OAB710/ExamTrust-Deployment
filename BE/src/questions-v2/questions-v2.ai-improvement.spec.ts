import { QuestionsService } from './questions-v2.service';

describe('AI improvement question content', () => {
  const service = Object.create(QuestionsService.prototype) as QuestionsService;

  it('removes editorial clarification suffixes from the saved student-facing stem', () => {
    expect((service as any).removeAiEditorialSuffix('10+100 (đã hiệu chỉnh để làm rõ yêu cầu)')).toBe('10+100');
    expect((service as any).removeAiEditorialSuffix('What is 2 + 2? (Revised to clarify requirements)')).toBe('What is 2 + 2?');
  });
});
