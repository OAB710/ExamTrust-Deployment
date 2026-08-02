import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

const AI_SECTIONS = [
  'CONTENT',
  'ANSWERS',
  'EXPLANATION',
  'CLASSIFICATION',
  'QUALITY_REVIEW',
  'RISK_ASSESSMENT',
] as const;

type AISectionValue = (typeof AI_SECTIONS)[number];

type AiTaskType = 'single-question' | 'exam-questions' | 'draft-section' | 'exam-quality-review' | 'exam-risk-assessment' | 'question-improvement' | 'proctoring-evidence';

interface CreateAiJobParams {
  task: AiTaskType;
  draftId?: string | null;
  questionVersionId?: string | null;
  examId?: string | null;
  submissionId?: string | null;
  section?: AISectionValue | string | null;
  payload: Record<string, any>;
  requestedBy?: string | null;
}

@Injectable()
export class AiJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  private normalizeSection(section?: AISectionValue | string | null): AISectionValue {
    const normalized = String(section || '').trim().toUpperCase();
    return AI_SECTIONS.includes(normalized as AISectionValue)
      ? (normalized as AISectionValue)
      : 'CONTENT';
  }

  async createJob(params: CreateAiJobParams) {
    const provider = process.env.AI_PROVIDER || 'google';
    const ollamaModel = process.env.AI_OLLAMA_MODEL || 'gemma3:4b';
    const ollamaVisionModel = process.env.AI_OLLAMA_VISION_MODEL || process.env.OLLAMA_VISION_MODEL || 'moondream';
    const googleModel = process.env.AI_MODEL || 'gemini-2.0-flash';
    const nvidiaModel = process.env.AI_NVIDIA_MODEL || 'z-ai/glm-5.2';
    const openRouterModel = process.env.AI_OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
    const model =
      provider === 'ollama'
        ? (params.task === 'proctoring-evidence' ? ollamaVisionModel : ollamaModel)
        : provider === 'nvidia'
          ? nvidiaModel
        : provider === 'openrouter'
          ? openRouterModel
        : params.task === 'single-question' || params.task === 'exam-questions' || params.task === 'exam-quality-review' || params.task === 'exam-risk-assessment' || params.task === 'question-improvement'
          ? googleModel
          : ollamaModel;
    const section = this.normalizeSection(params.section);

    const record = await this.prisma.aIGenerationRecord.create({
      data: {
        draftId: params.draftId ?? null,
        questionVersionId: params.questionVersionId ?? null,
        examId: params.examId ?? null,
        submissionId: params.submissionId ?? null,
        section,
        status: 'QUEUED',
        reviewStatus: 'PENDING',
        provider,
        model,
        prompt: {
          task: params.task,
          payload: params.payload,
          requestedBy: params.requestedBy ?? null,
          context: params.payload?.context ?? {},
        },
      },
    });

    try {
      await this.queueService.enqueueAiGeneration({
        jobId: record.id,
        task: params.task,
        draftId: params.draftId ?? null,
        questionVersionId: params.questionVersionId ?? null,
        examId: params.examId ?? null,
        submissionId: params.submissionId ?? null,
        section,
        payload: params.payload,
      });
    } catch (error: any) {
      const message = 'Không thể đưa yêu cầu AI vào hàng đợi. Vui lòng thử lại sau.';
      await this.prisma.aIGenerationRecord.update({
        where: { id: record.id },
        data: { status: 'FAILED', errorMessage: String(error?.message || message) },
      });
      throw new ServiceUnavailableException({ code: 'AI_QUEUE_UNAVAILABLE', message });
    }

    return record;
  }
}
