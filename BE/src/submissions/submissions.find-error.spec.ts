import { SubmissionsService } from './submissions.service';

describe('FIND_ERROR grading', () => {
  const service = Object.create(SubmissionsService.prototype) as SubmissionsService;

  it('accepts all selected error lines regardless of their order', () => {
    expect((service as any).compareAnswers({ answers: ['C', 'A'] }, { answers: ['A', 'C'] }, 'FIND_ERROR')).toBe(true);
  });

  it('continues to grade legacy answer payloads and rejects missing or extra lines', () => {
    expect((service as any).compareAnswers({ answers: ['B'] }, { answer: 'B' }, 'FIND_ERROR')).toBe(true);
    expect((service as any).compareAnswers({ answer: 'A' }, { answers: ['A', 'C'] }, 'FIND_ERROR')).toBe(false);
    expect((service as any).compareAnswers({ answers: ['A', 'B', 'C'] }, { answers: ['A', 'C'] }, 'FIND_ERROR')).toBe(false);
  });
});
