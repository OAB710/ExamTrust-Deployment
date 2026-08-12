import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import {
  buildExamTrustPromptHeader,
  ExamTrustAiContext,
  getOllamaGenerationOptions,
  OllamaGenerationOptions,
} from './ai-profile';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private nvidiaAI: OpenAI;
  private openRouterAI: OpenAI;
  private deepseekAI: OpenAI;
  private model: any;
  private provider: string;
  private localUrl: string | undefined;
  private ollamaUrl: string;
  private ollamaModel: string;
  private ollamaVisionModel: string;
  private ollamaVisionFallbackModel: string;
  private nvidiaModel: string;
  private openRouterModel: string;
  private deepseekModel: string;
  private appName: string;
  private defaultLanguage: string;
  private ollamaTemperature: number;
  private ollamaTopP: number;
  private ollamaRepeatPenalty: number;
  private ollamaNumCtx: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    this.provider = this.configService.get<string>('AI_PROVIDER') || 'google';
    this.localUrl = this.configService.get<string>('AI_LOCAL_URL') || undefined;
    // OLLAMA_* aliases make the self-hosted vision worker easy to configure
    // in Docker/compose while preserving the existing AI_OLLAMA_* contract.
    this.ollamaUrl = this.configService.get<string>('AI_OLLAMA_URL')
      || this.configService.get<string>('OLLAMA_BASE_URL')
      || 'http://localhost:11434';
    this.ollamaModel = this.configService.get<string>('AI_OLLAMA_MODEL') || 'gemma3:4b';
    this.ollamaVisionModel = this.configService.get<string>('AI_OLLAMA_VISION_MODEL')
      || this.configService.get<string>('OLLAMA_VISION_MODEL')
      || 'gemma3:4b';
    this.ollamaVisionFallbackModel = this.configService.get<string>('AI_OLLAMA_VISION_FALLBACK_MODEL')
      || this.configService.get<string>('OLLAMA_VISION_FALLBACK_MODEL')
      || 'moondream';
    this.nvidiaModel = this.configService.get<string>('AI_NVIDIA_MODEL') || 'z-ai/glm-5.2';
    this.openRouterModel = this.configService.get<string>('AI_OPENROUTER_MODEL') || 'nvidia/nemotron-3-ultra-550b-a55b:free';
    this.deepseekModel = this.configService.get<string>('AI_DEEPSEEK_MODEL') || 'deepseek-chat';
    this.appName = this.configService.get<string>('AI_APP_NAME') || 'Academic Trust Suite';
    this.defaultLanguage = this.configService.get<string>('AI_DEFAULT_LANGUAGE') || 'vi';
    this.ollamaTemperature = Number(this.configService.get<string>('AI_OLLAMA_TEMPERATURE') || 0.2);
    this.ollamaTopP = Number(this.configService.get<string>('AI_OLLAMA_TOP_P') || 0.85);
    this.ollamaRepeatPenalty = Number(this.configService.get<string>('AI_OLLAMA_REPEAT_PENALTY') || 1.1);
    this.ollamaNumCtx = Number(this.configService.get<string>('AI_OLLAMA_NUM_CTX') || 8192);

    if (this.provider === 'google') {
      if (!apiKey) {
        this.logger.warn('GOOGLE_AI_API_KEY not set. AI features will not work.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey || '');
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } else if (this.provider === 'ollama') {
      this.logger.log(`AI provider: Ollama @ ${this.ollamaUrl} (model: ${this.ollamaModel}, vision: ${this.ollamaVisionModel}, fallback: ${this.ollamaVisionFallbackModel})`);
    } else if (this.provider === 'nvidia') {
      const nvidiaApiKey = this.configService.get<string>('NVIDIA_API_KEY');
      const nvidiaBaseUrl = this.configService.get<string>('AI_NVIDIA_BASE_URL') || 'https://integrate.api.nvidia.com/v1';
      if (!nvidiaApiKey) {
        this.logger.warn('NVIDIA_API_KEY not set. NVIDIA AI features will not work.');
      }
      this.nvidiaAI = new OpenAI({
        apiKey: nvidiaApiKey || '',
        baseURL: nvidiaBaseUrl,
      });
      this.logger.log(`AI provider: NVIDIA @ ${nvidiaBaseUrl} (model: ${this.nvidiaModel})`);
    } else if (this.provider === 'openrouter') {
      const openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');
      const openRouterBaseUrl = this.configService.get<string>('AI_OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
      const referer = this.configService.get<string>('AI_OPENROUTER_HTTP_REFERER')
        || this.configService.get<string>('APP_BASE_URL')
        || this.configService.get<string>('FRONTEND_URL');
      const title = this.configService.get<string>('AI_OPENROUTER_X_TITLE') || this.appName;
      if (!openRouterApiKey) {
        this.logger.warn('OPENROUTER_API_KEY not set. OpenRouter AI features will not work.');
      }
      this.openRouterAI = new OpenAI({
        apiKey: openRouterApiKey || '',
        baseURL: openRouterBaseUrl,
        defaultHeaders: {
          ...(referer ? { 'HTTP-Referer': referer } : {}),
          ...(title ? { 'X-Title': title } : {}),
        },
      });
      this.logger.log(`AI provider: OpenRouter @ ${openRouterBaseUrl} (model: ${this.openRouterModel})`);
    } else if (this.provider === 'deepseek') {
      const deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
      const deepseekBaseUrl = this.configService.get<string>('AI_DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';
      if (!deepseekApiKey) {
        this.logger.warn('DEEPSEEK_API_KEY not set. DeepSeek AI features will not work.');
      }
      this.deepseekAI = new OpenAI({
        apiKey: deepseekApiKey || '',
        baseURL: deepseekBaseUrl,
      });
      this.logger.log(`AI provider: DeepSeek @ ${deepseekBaseUrl} (model: ${this.deepseekModel})`);
    } else {
      this.logger.log(`AI provider set to '${this.provider}'. Using local/mock mode.`);
    }
  }

  async onModuleInit() {
    if (this.provider !== 'ollama') return;
    await Promise.all([this.ollamaVisionModel, this.ollamaVisionFallbackModel]
      .filter((model, index, models) => Boolean(model) && models.indexOf(model) === index)
      .map((model) => this.checkOllamaVisionModel(model)));
  }

  private async checkOllamaVisionModel(model: string): Promise<void> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });
      if (!response.ok) {
        this.logger.warn(`Ollama vision model '${model}' is unavailable (${response.status}). Pull it or update AI_OLLAMA_VISION_MODEL.`);
        return;
      }
      const details: any = await response.json();
      if (!Array.isArray(details.capabilities) || !details.capabilities.includes('vision')) {
        this.logger.warn(`Ollama model '${model}' is available but does not advertise vision capability.`);
      } else {
        this.logger.log(`Ollama vision model ready: ${model}`);
      }
    } catch (error: any) {
      this.logger.warn(`Unable to verify Ollama vision model '${model}': ${String(error?.message || error)}`);
    }
  }

  getProviderStatus(): { provider: string; model: string } {
    const modelByProvider: Record<string, string | undefined> = {
      google: 'gemini-2.0-flash',
      ollama: this.ollamaModel,
      nvidia: this.nvidiaModel,
      openrouter: this.openRouterModel,
      deepseek: this.deepseekModel,
    };
    return { provider: this.provider, model: modelByProvider[this.provider] || this.provider };
  }

  /**
   * Question-generation policy: Vietnamese is the default regardless of a
   * caller-supplied locale. English is selected only when the lecturer's
   * prompt explicitly asks for English output.
   */
  private resolveQuestionOutputLanguage(prompt: string): 'vi' | 'en' {
    const normalized = String(prompt || '').toLowerCase();
    const explicitlyRequestsEnglish =
      /ti[eế]ng\s*anh|english\s*(?:question|questions|output|language|version|please)?\b/.test(normalized)
      || /\b(?:in|write\s+in|generate\s+in|create\s+in|answer\s+in)\s+(?:the\s+)?english\b/.test(normalized)
      || /(?:vi[eế]t|ghi|tạo|tao|trả\s*lời|tra\s*loi)\s+(?:bằng|bang)\s+ti[eế]ng\s*anh/.test(normalized);

    return explicitlyRequestsEnglish ? 'en' : 'vi';
  }

  /**
   * Small/free LLMs often ignore a soft "pick whatever difficulty fits"
   * instruction and default to Medium regardless of the topic. When the
   * lecturer's own prompt already signals a level explicitly (e.g. "cơ bản",
   * "nâng cao"), trust that keyword over the model's judgment.
   */
  private containsCue(normalized: string, cue: string): boolean {
    // A plain \b-anchored regex would silently fail here: \b relies on \w,
    // which doesn't treat Vietnamese diacritic letters (đ, ơ, ê, ...) as word
    // characters, so a boundary right before "đơn giản" never matches. A bare
    // substring check overcorrects the other way — "kho" as a stand-in for
    // "khó" would false-positive inside "Khoa học" (Computer Science). Using
    // \p{L}/\p{N} (Unicode letter/number classes) for the boundary instead
    // of \w gets both cases right.
    const escaped = cue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u').test(normalized);
  }

  private inferDifficultyFromPrompt(prompt: string): number | undefined {
    const normalized = String(prompt || '').toLowerCase();
    const easyCues = ['đơn giản', 'don gian', 'cơ bản', 'co ban', 'sơ cấp', 'so cap', 'dễ', 'basic', 'simple', 'easy', 'introductory', 'beginner'];
    const hardCues = ['nâng cao', 'nang cao', 'phức tạp', 'phuc tap', 'chuyên sâu', 'chuyen sau', 'khó', 'kho', 'advanced', 'complex', 'difficult', 'hard', 'expert'];

    if (hardCues.some((cue) => this.containsCue(normalized, cue))) return 0.8;
    if (easyCues.some((cue) => this.containsCue(normalized, cue))) return 0.2;
    return undefined;
  }

  async generateQuestion(params: {
    prompt: string;
    questionType?: string;
    difficulty?: number;
    language?: string;
    courseName?: string;
    useCase?: string;
    context?: ExamTrustAiContext;
  }) {
    const {
      prompt,
      questionType = 'MULTIPLE_CHOICE',
      difficulty,
      language,
      courseName,
      useCase = 'question_bank',
      context,
    } = params;

    // No difficulty was requested: check the lecturer's own wording for an
    // explicit level first (reliable), and only leave it to the model's
    // judgment (unreliable on small/free models) when no such cue exists.
    const requestedAutoDifficulty = difficulty === undefined || difficulty === null;
    const inferredDifficulty = requestedAutoDifficulty ? this.inferDifficultyFromPrompt(prompt) : undefined;
    const autoDifficulty = requestedAutoDifficulty && inferredDifficulty === undefined;
    const effectiveDifficulty = inferredDifficulty ?? difficulty ?? 0.5;

    const targetLanguage = this.resolveQuestionOutputLanguage(prompt);
    const difficultyLabel = effectiveDifficulty <= 0.4 ? 'Easy' : effectiveDifficulty <= 0.7 ? 'Medium' : 'Hard';
    const langInstruction = targetLanguage === 'vi'
      ? 'Generate the question and every human-readable field (content, options, answers, explanation, topic, learningObjective) in Vietnamese. Do not switch to English merely because the source prompt contains English technical terms.'
      : 'The user explicitly requested English. Generate the question and every human-readable field (content, options, answers, explanation, topic, learningObjective) in English.';

    const profilePrompt = buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'question_generation',
      language: targetLanguage,
      questionType,
      questionCount: 1,
      context: {
        courseName,
        questionType,
        difficulty: effectiveDifficulty,
        currentStem: prompt,
        extra: { useCase },
        ...(context || {}),
      },
    });

    const difficultyInstruction = autoDifficulty
      ? 'Choose whichever difficulty (Easy, Medium, or Hard) best fits this topic and phrasing, and report your choice in the "difficulty" field (0 = easiest, 1 = hardest).'
      : `Difficulty level: ${difficultyLabel} (${effectiveDifficulty}/5)`;

    const systemPrompt = `${profilePrompt}
${langInstruction}

Generate a ${this.getTypeLabel(questionType)} question about the following topic:
"${prompt}"

${difficultyInstruction}

You MUST respond with a valid JSON object (no markdown, no code fences, just pure JSON) with this exact structure:
{
  "content": "The question text",
  "type": "${questionType}",
  "explanation": "Detailed explanation of the correct answer",
  "difficulty": ${autoDifficulty ? '<your chosen difficulty, 0-1>' : effectiveDifficulty},
  "points": <appropriate points 1-10>,
  "topic": "specific topic name",
  "learningObjective": "Action verb + what students should be able to do"${this.getOptionsInstruction(questionType) ? `,\n  ${this.getOptionsInstruction(questionType)}` : ''}
}

Rules:
- The question must be clear, academically rigorous, and appropriate for university exams
- For multiple choice: provide exactly 4 options (A, B, C, D), only one correct
- For true/false: options should be {"A": "True", "B": "False"}
- For essay/short answer: omit options, set correctAnswer to {"answer": "sample answer guideline"}
- For fill in the blank: do NOT include "options" or "correctAnswer". Instead, embed every blank directly inside "content" using double square brackets around the correct answer, e.g. "The capital of France is [[Paris]]." or "What is the sum of 7 and 5? [[12]]." Every blank must have its answer inside the brackets.
- For matching: do NOT include "options" or "correctAnswer". Instead provide exactly 4 "pairs", each a {"left", "right"} object; "content" should be the matching instructions/prompt, not the pairs themselves.
- For ordering: do NOT include "options" or "correctAnswer". Instead provide exactly 4 "items" as an array of strings already sorted in the single correct order; "content" should be the instructions asking the student to arrange them, not the items themselves.
- For find the error: "content" should be ONLY a short intro (e.g. "Find the bug in this code:"), NOT the code. The options are 4 individual lines of code from a single code snippet. Each option is ONE line of real code (A, B, C, D). Only ONE line has a bug; the other 3 are correct. The lines must be actual code, not meta-descriptions. Example: {"options": {"A": "int x = 1;", "B": "int y = 2", "C": "int z = 3;", "D": "return x + z;"}, "correctAnswer": {"answer": "B"}} — line B is missing the semicolon. Do NOT write descriptions like "this line has a typo" — write the actual buggy code line itself.
- Tags should be relevant academic topics (2-4 tags)
// Tags removed from schema - do not request tags
- Points should reflect difficulty (easy: 1-3, medium: 3-5, hard: 5-10)
- "topic": 1-5 words naming the specific academic topic of this question
- "learningObjective": one sentence starting with an action verb (e.g. "Understand...", "Apply...", "Analyze...")
- Return ONLY the JSON object, no additional text`;

    try {
      let responseText: string;

      if (this.provider === 'ollama') {
        responseText = await this._callOllama(
          systemPrompt,
          this.buildOllamaOptions('question_generation'),
        );
      } else if (this.provider === 'nvidia') {
        responseText = await this._callNvidia(systemPrompt);
      } else if (this.provider === 'openrouter') {
        responseText = await this._callOpenRouter(systemPrompt);
      } else if (this.provider === 'deepseek') {
        responseText = await this._callDeepSeek(systemPrompt);
      } else if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: systemPrompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        responseText = await resp.text();
      } else if (this.provider === 'mock') {
        responseText = JSON.stringify({
          content: `Câu hỏi mẫu về ${prompt}`,
          type: questionType,
          explanation: 'Đây là giải thích mẫu dùng cho môi trường phát triển.',
          difficulty: Math.round(effectiveDifficulty * 4) / 4,
          points: 1,
          options: questionType === 'MULTIPLE_CHOICE' || questionType === 'FIND_ERROR' ? { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' } : null,
          correctAnswer: questionType === 'MULTIPLE_CHOICE' || questionType === 'FIND_ERROR' ? { answer: 'A' } : null,
          pairs: questionType === 'MATCHING' ? [
            { left: 'Thuật ngữ 1', right: 'Định nghĩa ghép đôi 1' },
            { left: 'Thuật ngữ 2', right: 'Định nghĩa ghép đôi 2' },
            { left: 'Thuật ngữ 3', right: 'Định nghĩa ghép đôi 3' },
            { left: 'Thuật ngữ 4', right: 'Định nghĩa ghép đôi 4' },
          ] : null,
        });
      } else {
        const result = await this.model.generateContent(systemPrompt);
        responseText = result.response.text();
      }

      let parsed: any;
      try {
        parsed = await this.safeJsonParse(responseText);
      } catch (parseError: any) {
        throw new Error(parseError.message);
      }

      const hasCompleteMatchingPairs = (value: unknown) =>
        Array.isArray(value)
        && value.length === 4
        && value.every((pair) =>
          typeof pair === 'object'
          && pair !== null
          && String((pair as { left?: unknown }).left || '').trim()
          && String((pair as { right?: unknown }).right || '').trim(),
        );

      // Smaller local models occasionally omit every `right` value despite
      // returning valid JSON. Retry once with an explicit repair instruction
      // so the editor never receives half-complete matching rows.
      if (String(questionType).toUpperCase() === 'MATCHING' && !hasCompleteMatchingPairs(parsed.pairs)) {
        if (this.provider !== 'ollama') {
          throw new Error('AI trả về danh sách ghép cặp chưa đầy đủ; cả 4 cặp đều phải có đủ giá trị bên trái và bên phải');
        }
        const repairedText = await this._callOllama(
          `${systemPrompt}\n\nYour previous response was invalid because one or more matching pairs had an empty or missing \"right\" value. Generate the complete question again. Each of the exactly 4 pairs MUST have non-empty \"left\" and non-empty \"right\" strings.`,
          this.buildOllamaOptions('question_generation'),
        );
        parsed = await this.safeJsonParse(repairedText);
        if (!hasCompleteMatchingPairs(parsed.pairs)) {
          throw new Error('AI vẫn trả về danh sách ghép cặp chưa đầy đủ sau khi thử lại; vui lòng tạo lại');
        }
      }

      const normalizeDifficulty = (val: any): number | undefined => {
        if (val === undefined || val === null) return undefined;
        const n = Number(val);
        if (Number.isNaN(n)) return undefined;
        if (n > 1) {
          return Math.max(0, Math.min(1, (n - 1) / 4));
        }
        return Math.max(0, Math.min(1, n));
      };

      const parsedDifficulty = normalizeDifficulty(parsed.difficulty);
      // A keyword cue in the lecturer's own prompt is more trustworthy than
      // what the model reports, so it wins even if the model answered anyway.
      const finalDifficulty = inferredDifficulty ?? (parsedDifficulty !== undefined ? parsedDifficulty : effectiveDifficulty);

      return {
        content: parsed.content || '',
        type: parsed.type || questionType,
        explanation: parsed.explanation || '',
        difficulty: finalDifficulty,
        points: parsed.points || 1,
        topic: parsed.topic || '',
        learningObjective: parsed.learningObjective || '',
        options: parsed.options || null,
        correctAnswer: parsed.correctAnswer || null,
        pairs: Array.isArray(parsed.pairs) ? parsed.pairs : null,
        items: Array.isArray(parsed.items) ? parsed.items : null,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate question:', error);
      throw new Error(`Tạo nội dung bằng AI thất bại: ${error.message}`);
    }
  }

  async generateExamQuestions(params: {
    prompt: string;
    questionCount: number;
    difficulty?: number;
    questionType?: string;
    language?: string;
    courseName?: string;
    useCase?: string;
    context?: ExamTrustAiContext;
  }) {
    const {
      prompt,
      questionCount,
      difficulty = 0.5,
      questionType,
      language,
      courseName,
      useCase = 'exam',
      context,
    } = params;

    const targetLanguage = this.resolveQuestionOutputLanguage(prompt);
    const diffLabel = difficulty <= 0.3 ? 'Easy' : difficulty <= 0.5 ? 'Medium' : 'Hard';
    const courseContext = courseName ? `for the course "${courseName}"` : '';
    const normalizedType = this.normalizeQuestionType(questionType);
    const typeInstruction = normalizedType === 'MIXED'
      ? '- Mix question types: mostly MULTIPLE_CHOICE, but include some TRUE_FALSE, SHORT_ANSWER, and ESSAY'
      : `- Generate ALL questions as ${normalizedType}`;
    const sampleType = normalizedType === 'MIXED' ? 'MULTIPLE_CHOICE' : normalizedType;
    const langInstruction = targetLanguage === 'vi'
      ? 'Generate every question and every human-readable field (content, options, answers, explanations, topics, learning objectives) in Vietnamese. Do not switch to English merely because the source prompt contains English technical terms.'
      : 'The user explicitly requested English. Generate every question and every human-readable field in English.';

    const profilePrompt = buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'exam_generation',
      language: targetLanguage,
      questionType: normalizedType,
      questionCount,
      context: {
        courseName,
        questionType: normalizedType,
        questionCount,
        difficulty,
        extra: { useCase },
        ...(context || {}),
      },
    });

    const systemPrompt = `${profilePrompt}
${langInstruction}

Generate ${questionCount} exam questions ${courseContext} about:
"${prompt}"

Overall difficulty: ${diffLabel}

You MUST respond with a valid JSON object (no markdown, no code fences, just pure JSON) with this exact structure:
{
  "questions": [
    {
      "content": "Question text",
      "type": "${sampleType}",
      "explanation": "Explanation of the correct answer",
      "difficulty": <1-5>,
      "points": <1-10>,
      "options": {"A": "Option A text", "B": "Option B text", "C": "Option C text", "D": "Option D text"},
      "correctAnswer": {"answer": "B"}
    }
  ]
}

Rules:
${typeInstruction}
- For MULTIPLE_CHOICE: 4 options (A,B,C,D), one correct, correctAnswer: {"answer": "B"}
- For TRUE_FALSE: options: {"A": "True", "B": "False"}, correctAnswer: {"answer": "A"} or {"answer": "B"}
- For SHORT_ANSWER: no options field, correctAnswer: {"answer": "expected short answer"}
- For ESSAY: no options field, correctAnswer: {"answer": "grading guidelines"}
- Vary difficulty around the ${diffLabel} level
- Each question should cover a different aspect of the topic
- Questions should be academically rigorous and university-level
// Tags removed from schema - do not request tags
- Generate exactly ${questionCount} questions
- Return ONLY the JSON object, no additional text`;

    try {
      let responseText: string;

      if (this.provider === 'ollama') {
        responseText = await this._callOllama(
          systemPrompt,
          this.buildOllamaOptions('exam_generation'),
        );
      } else if (this.provider === 'nvidia') {
        responseText = await this._callNvidia(systemPrompt);
      } else if (this.provider === 'openrouter') {
        responseText = await this._callOpenRouter(systemPrompt);
      } else if (this.provider === 'deepseek') {
        responseText = await this._callDeepSeek(systemPrompt);
      } else if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: systemPrompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        responseText = await resp.text();
      } else if (this.provider === 'mock') {
        const sample = {
          questions: Array.from({ length: questionCount }).map((_, i) => ({
            content: `Câu hỏi mẫu ${i + 1} về ${prompt}`,
            type: sampleType,
            explanation: 'Giải thích mẫu',
            difficulty: Math.round(difficulty * 4) / 4,
            points: 1,
            options: { A: 'A', B: 'B', C: 'C', D: 'D' },
            correctAnswer: { answer: 'A' },
          })),
        };
        responseText = JSON.stringify(sample);
      } else {
        const result = await this.model.generateContent(systemPrompt);
        responseText = result.response.text();
      }

      const parsed = await this.safeJsonParse(responseText);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Định dạng phản hồi không hợp lệ: thiếu danh sách câu hỏi');
      }

      const normalizeDifficulty = (val: any): number => {
        const n = Number(val);
        if (Number.isNaN(n)) return difficulty;
        if (n > 1) return Math.max(0, Math.min(1, (n - 1) / 4));
        return Math.max(0, Math.min(1, n));
      };

      return parsed.questions.map((q: any) => ({
        content: q.content || '',
        type: q.type || sampleType,
        explanation: q.explanation || '',
        difficulty: q.difficulty !== undefined ? normalizeDifficulty(q.difficulty) : difficulty,
        points: q.points || 1,
        options: q.options || null,
        correctAnswer: q.correctAnswer || null,
      }));
    } catch (error: any) {
      this.logger.error('Failed to generate exam questions:', error);
      throw new Error(`Tạo nội dung bằng AI thất bại: ${error.message}`);
    }
  }

  async analyzeProctoringImage(params: { image: Buffer; mimeType: string }) {
    const prompt = `Analyze this webcam frame for an academic exam. Return ONLY JSON: {"tags":[{"tag":"FACE_NOT_VISIBLE|MULTIPLE_PEOPLE|FACE_PARTIALLY_OCCLUDED|CAMERA_COVERED_OR_DARK|IMAGE_TOO_BLURRY|CAMERA_FRAME_CHANGED|POSSIBLE_FROZEN_VIDEO|POSSIBLE_PHONE|PROHIBITED_MATERIAL_VISIBLE","confidence":0-1,"note":"short factual Vietnamese description"}]}. Tags are advisory evidence only. Do not claim cheating. Include only visually supported tags.`;
    if (this.provider === 'mock') return { tags: [], model: 'mock' };
    let text: string;
    let model: string;
    if (this.provider === 'ollama') {
      model = this.ollamaVisionModel;
      try {
        text = await this._callOllamaVision(prompt, params.image, model);
      } catch (primaryError: any) {
        if (!this.ollamaVisionFallbackModel || this.ollamaVisionFallbackModel === model) throw primaryError;
        this.logger.warn(`Ollama vision primary '${model}' failed; retrying fallback '${this.ollamaVisionFallbackModel}': ${String(primaryError?.message || primaryError)}`);
        model = this.ollamaVisionFallbackModel;
        text = await this._callOllamaVision(prompt, params.image, model);
      }
    } else if (this.provider === 'google') {
      const result = await this.model.generateContent([
        { text: prompt },
        { inlineData: { data: params.image.toString('base64'), mimeType: params.mimeType } },
      ]);
      text = String(result.response.text() || '');
      model = 'gemini-2.0-flash';
    } else {
      throw new Error(`Phân tích hình ảnh giám sát chưa được cấu hình cho nhà cung cấp AI '${this.provider}'`);
    }

    const parsed = JSON.parse(text.replace(/```json\s*/gi, '').replace(/```/g, '').trim());
    const allowed = new Set(['FACE_NOT_VISIBLE', 'MULTIPLE_PEOPLE', 'FACE_PARTIALLY_OCCLUDED', 'CAMERA_COVERED_OR_DARK', 'IMAGE_TOO_BLURRY', 'CAMERA_FRAME_CHANGED', 'POSSIBLE_FROZEN_VIDEO', 'POSSIBLE_PHONE', 'PROHIBITED_MATERIAL_VISIBLE']);
    return {
      tags: Array.isArray(parsed?.tags) ? parsed.tags.filter((item: any) => allowed.has(String(item?.tag))).slice(0, 5).map((item: any) => ({ tag: String(item.tag), confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)), note: String(item.note || '').slice(0, 300) })) : [],
      model,
    };
  }

  async generateExamQualityReview(params: {
    examTitle?: string;
    courseName?: string;
    language?: string;
    examSummary: {
      totalSubmissions: number;
      avgScorePct?: number | null;
      passRate?: number | null;
      completionRate?: number | null;
    };
    questionStats: Array<{
      questionId: string;
      questionVersionId?: string | null;
      questionText: string;
      totalAttempts: number;
      correctRate: number;
      incorrectRate: number;
      skipRate: number;
      avgTimeSeconds: number | null;
      difficultyIndex: number | null;
      discriminationIndex: number | null;
    }>;
    context?: ExamTrustAiContext;
  }) {
    const { examTitle, courseName, language, examSummary, questionStats, context } = params;
    const targetLanguage = language || this.defaultLanguage;
    const langInstruction = targetLanguage === 'vi'
      ? 'Write the overallSummary, reasonSummary and recommendation fields in Vietnamese.'
      : 'Write the overallSummary, reasonSummary and recommendation fields in English.';

    const profilePrompt = buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'exam_quality_review',
      language: targetLanguage,
      context: {
        examTitle,
        courseName,
        analytics: {
          totalAttempts: examSummary.totalSubmissions,
          passRate: examSummary.passRate ?? undefined,
          averageScore: examSummary.avgScorePct ?? undefined,
        },
        ...(context || {}),
      },
    });

    const statsTable = questionStats.map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText.slice(0, 200),
      totalAttempts: q.totalAttempts,
      correctRatePct: Number(q.correctRate.toFixed(1)),
      incorrectRatePct: Number(q.incorrectRate.toFixed(1)),
      skipRatePct: Number(q.skipRate.toFixed(1)),
      avgTimeSeconds: q.avgTimeSeconds,
      difficultyIndex: q.difficultyIndex,
      discriminationIndex: q.discriminationIndex,
    }));

    const systemPrompt = `${profilePrompt}
${langInstruction}

You are reviewing the real statistical performance of an exam ("${examTitle || 'Untitled exam'}") to help the lecturer improve question quality.

Exam-level summary:
${JSON.stringify({
  totalSubmissions: examSummary.totalSubmissions,
  avgScorePct: examSummary.avgScorePct ?? null,
  passRate: examSummary.passRate ?? null,
  completionRate: examSummary.completionRate ?? null,
}, null, 2)}

Per-question statistics (real attempt data, one entry per question):
${JSON.stringify(statsTable, null, 2)}

You MUST respond with a valid JSON object (no markdown, no code fences, just pure JSON) with this exact structure:
{
  "overallSummary": "2-4 sentence overview of the exam's quality based only on the numbers above",
  "suggestions": [
    {
      "questionId": "must be one of the questionId values above",
      "severity": "high" | "medium" | "low",
      "reasonSummary": "explain WHY this question needs review, citing the specific numbers (difficulty index, discrimination index, incorrect/skip rate, avg time)",
      "recommendation": "concrete suggestion to improve the question's content, difficulty calibration, or distractor/answer options"
    }
  ]
}

Rules:
- Base every judgment strictly on the numbers provided. Do not invent statistics.
- Only include a question in "suggestions" if its numbers indicate a real quality concern (e.g. discrimination index near 0 or negative, difficulty index extremely high/low, incorrect rate or skip rate unusually high, abnormal avg time).
- If none of the questions show a concern, return an empty suggestions array.
- Never suggest editing, deleting, or publishing anything yourself — only describe what the lecturer should review.
- Return ONLY the JSON object, no additional text.`;

    try {
      let responseText: string;

      if (this.provider === 'ollama') {
        responseText = await this._callOllama(
          systemPrompt,
          this.buildOllamaOptions('grading_support'),
        );
      } else if (this.provider === 'nvidia') {
        responseText = await this._callNvidia(systemPrompt);
      } else if (this.provider === 'openrouter') {
        responseText = await this._callOpenRouter(systemPrompt);
      } else if (this.provider === 'deepseek') {
        responseText = await this._callDeepSeek(systemPrompt);
      } else if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: systemPrompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        responseText = await resp.text();
      } else if (this.provider === 'mock') {
        responseText = JSON.stringify({
          overallSummary: `Tóm tắt rà soát chất lượng mẫu cho ${examTitle || 'bài thi này'}.`,
          suggestions: questionStats.slice(0, 1).map((q) => ({
            questionId: q.questionId,
            severity: 'medium',
            reasonSummary: 'Lý do mẫu dựa trên số liệu đã cung cấp.',
            recommendation: 'Đề xuất mẫu dùng cho môi trường phát triển.',
          })),
        });
      } else {
        const result = await this.model.generateContent(systemPrompt);
        responseText = result.response.text();
      }

      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (typeof parsed.overallSummary !== 'string' || !Array.isArray(parsed.suggestions)) {
        throw new Error('Định dạng phản hồi không hợp lệ: thiếu tóm tắt tổng quan hoặc danh sách đề xuất');
      }

      const validQuestionIds = new Set(questionStats.map((q) => q.questionId));
      const validSeverities = new Set(['high', 'medium', 'low']);

      const suggestions = parsed.suggestions
        .filter((s: any) => s && validQuestionIds.has(String(s.questionId)))
        .map((s: any) => ({
          questionId: String(s.questionId),
          severity: validSeverities.has(String(s.severity)) ? String(s.severity) : 'medium',
          reasonSummary: String(s.reasonSummary || '').trim(),
          recommendation: String(s.recommendation || '').trim(),
        }))
        .filter((s: any) => s.reasonSummary && s.recommendation);

      return {
        overallSummary: String(parsed.overallSummary).trim(),
        suggestions,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate exam quality review:', error);
      throw new Error(`Tạo nội dung bằng AI thất bại: ${error.message}`);
    }
  }

  async assessExamIntegrityRisk(params: {
    examTitle?: string;
    courseName?: string;
    language?: string;
    submissionSummary: {
      attemptNo?: number;
      score?: number | null;
      durationMinutes?: number | null;
      timeSpentMinutes?: number | null;
    };
    signals: {
      tabSwitchCount: number;
      mouseAnomalies: number;
      fullscreenExitCount: number;
      focusLossCount: number;
      pageHiddenCount: number;
      tooFastAnswerCount: number;
      totalAnswers: number;
      totalIntegrityEvents: number;
      eventBreakdown: Record<string, number>;
    };
    context?: ExamTrustAiContext;
  }) {
    const { examTitle, courseName, language, submissionSummary, signals, context } = params;
    const targetLanguage = language || this.defaultLanguage;
    const langInstruction = targetLanguage === 'vi'
      ? 'Write the explanation and each signal description in Vietnamese.'
      : 'Write the explanation and each signal description in English.';

    const profilePrompt = buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'exam_risk_assessment',
      language: targetLanguage,
      context: {
        examTitle,
        courseName,
        attemptNo: submissionSummary.attemptNo,
        analytics: {
          averageScore: submissionSummary.score ?? undefined,
        },
        ...(context || {}),
      },
    });

    const systemPrompt = `${profilePrompt}
${langInstruction}

You are assessing the integrity RISK of a single exam attempt ("${examTitle || 'Untitled exam'}") using only the real proctoring/behavioral signals below. You are NOT a judge — you must never conclude or state that the student cheated. You only surface risk indicators for a human lecturer to review.

Attempt summary:
${JSON.stringify(submissionSummary, null, 2)}

Real behavioral signals recorded during this attempt:
${JSON.stringify(signals, null, 2)}

You MUST respond with a valid JSON object (no markdown, no code fences, just pure JSON) with this exact structure:
{
  "riskScore": 0,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "signals": [
    {
      "type": "short signal identifier, e.g. tab_switch, fullscreen_exit, too_fast_answers",
      "description": "explain what was observed and why it matters, citing the specific numbers",
      "weight": 0.0
    }
  ],
  "explanation": "2-4 sentence explanation of the overall risk assessment based only on the numbers above",
  "recommendReview": true
}

Rules:
- "riskScore" is an integer from 0 to 100 based strictly on the signals provided.
- "riskLevel" must be "LOW" for riskScore < 35, "MEDIUM" for 35-69, "HIGH" for 70+.
- Only include a signal in "signals" if its count is greater than zero and meaningfully contributes to risk.
- "weight" is a number between 0 and 1 indicating how much that signal contributed to the score.
- "recommendReview" must be true whenever riskLevel is "MEDIUM" or "HIGH", or when signals look unusual even at LOW risk.
- Never state or imply that the student definitely cheated. Use neutral, evidence-based language ("elevated tab-switch frequency", not "the student cheated").
- Base every judgment strictly on the numbers provided. Do not invent data.
- Return ONLY the JSON object, no additional text.`;

    try {
      let responseText: string;

      if (this.provider === 'ollama') {
        responseText = await this._callOllama(
          systemPrompt,
          this.buildOllamaOptions('grading_support'),
        );
      } else if (this.provider === 'nvidia') {
        responseText = await this._callNvidia(systemPrompt);
      } else if (this.provider === 'openrouter') {
        responseText = await this._callOpenRouter(systemPrompt);
      } else if (this.provider === 'deepseek') {
        responseText = await this._callDeepSeek(systemPrompt);
      } else if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: systemPrompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        responseText = await resp.text();
      } else if (this.provider === 'mock') {
        const mockScore = Math.min(100, signals.tabSwitchCount * 10 + signals.fullscreenExitCount * 15 + signals.tooFastAnswerCount * 5);
        responseText = JSON.stringify({
          riskScore: mockScore,
          riskLevel: mockScore >= 70 ? 'HIGH' : mockScore >= 35 ? 'MEDIUM' : 'LOW',
          signals: signals.tabSwitchCount > 0
            ? [{ type: 'tab_switch', description: 'Tín hiệu mẫu dùng cho môi trường phát triển.', weight: 0.5 }]
            : [],
          explanation: `Đánh giá rủi ro mẫu cho ${examTitle || 'bài thi này'}.`,
          recommendReview: mockScore >= 35,
        });
      } else {
        const result = await this.model.generateContent(systemPrompt);
        responseText = result.response.text();
      }

      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      const validLevels = new Set(['LOW', 'MEDIUM', 'HIGH']);
      if (
        typeof parsed.riskScore !== 'number'
        || !validLevels.has(String(parsed.riskLevel))
        || typeof parsed.explanation !== 'string'
        || !Array.isArray(parsed.signals)
      ) {
        throw new Error('Định dạng phản hồi không hợp lệ: thiếu điểm rủi ro, mức độ rủi ro, giải thích hoặc danh sách tín hiệu');
      }

      const riskScore = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScore))));
      const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW';

      const parsedSignals = parsed.signals
        .filter((s: any) => s && s.type && s.description)
        .map((s: any) => ({
          type: String(s.type).trim().slice(0, 100),
          description: String(s.description).trim(),
          weight: Math.max(0, Math.min(1, Number(s.weight) || 0)),
        }));

      return {
        riskScore,
        riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        signals: parsedSignals,
        explanation: String(parsed.explanation).trim(),
        recommendReview: riskLevel !== 'LOW' ? true : Boolean(parsed.recommendReview),
      };
    } catch (error: any) {
      this.logger.error('Failed to generate exam risk assessment:', error);
      throw new Error(`Tạo nội dung bằng AI thất bại: ${error.message}`);
    }
  }

  async generateQuestionImprovement(params: {
    language?: string;
    instruction?: string;
    context?: ExamTrustAiContext;
    original: Record<string, any>;
    analytics?: Record<string, any>;
    qualitySignals?: any[];
  }) {
    const targetLanguage = this.resolveQuestionOutputLanguage(
      params.instruction || String(params.context?.instruction || ''),
    );
    const langInstruction = targetLanguage === 'vi'
      ? 'Write diagnosis, reasons, warnings, and every human-readable field of the improved question in Vietnamese. Do not switch to English merely because the original question or technical terms are in English.'
      : 'The lecturer explicitly requested English. Write diagnosis, reasons, warnings, and every human-readable field of the improved question in English.';

    const original = params.original || {};
    const questionType = String(original.type || params.context?.questionType || 'MULTIPLE_CHOICE');
    const prompt = `${buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'question_quality_improvement',
      language: targetLanguage,
      questionType,
      context: params.context || {},
    })}
${langInstruction}

You are helping a lecturer improve a question with weak assessment performance. You must produce a proposal only. Never say that the question has already been updated.

Original question snapshot:
${JSON.stringify(original, null, 2)}

Aggregated performance analytics, without student identities:
${JSON.stringify(params.analytics || {}, null, 2)}
${params.analytics?.possibleKeyError ? `
IMPORTANT — a deterministic statistical check (not a guess) found that option "${params.analytics.possibleKeyError.mostPickedOptionLetter}" was chosen by ${params.analytics.possibleKeyError.mostPickedOptionRate}% of students, more than the option currently marked correct ("${params.analytics.possibleKeyError.correctOptionLetter}", chosen by only ${params.analytics.possibleKeyError.correctOptionRate}%), across ${params.analytics.possibleKeyError.sampleSize} answers. This is the classic signature of a MIS-KEYED ANSWER (the lecturer marked the wrong option as correct), not a hard-but-correctly-keyed question. Read the question content and every option's actual text yourself and independently verify which option is truly correct. If "${params.analytics.possibleKeyError.mostPickedOptionLetter}" is indeed correct, set "diagnosis.issues" to include type "INCORRECT_ANSWER" and change "suggestion.correctAnswer" to it — do not just keep the original answer key out of caution. If your own reading of the question shows the original key ("${params.analytics.possibleKeyError.correctOptionLetter}") actually IS correct and the question is simply ambiguous/misleading, say so explicitly in "diagnosis.reason" instead of silently agreeing with the statistical signal.
` : ''}
Quality review signals:
${JSON.stringify(params.qualitySignals || [], null, 2)}

Lecturer instruction:
${params.instruction || 'No additional instruction.'}

You MUST respond with a valid JSON object (no markdown, no code fences, just pure JSON) with this exact structure:
{
  "diagnosis": {
    "issues": [
      {
        "type": "AMBIGUOUS_WORDING | WEAK_DISTRACTOR | WRONG_DIFFICULTY | INCORRECT_ANSWER | POOR_EXPLANATION | OTHER",
        "description": "string"
      }
    ],
    "reason": "string"
  },
  "suggestion": {
    "content": "string",
    "options": {},
    "correctAnswer": {},
    "explanation": "string",
    "difficulty": 1
  },
  "changes": [
    {
      "field": "content",
      "before": "string",
      "after": "string",
      "reason": "string"
    }
  ],
  "confidence": 0.0,
  "warnings": []
}

Rules:
- Preserve the original question type unless there is a clear quality reason to adjust only wording/options.
- Return only the student-facing question text in "suggestion.content"; never append editorial notes such as "(đã hiệu chỉnh để làm rõ yêu cầu)" or any equivalent status annotation.
- Keep the answer schema compatible with the original options and correctAnswer shape.
- Do not include student names, emails, or individual answer records.
- "difficulty" must be an integer from 1 to 10.
- "confidence" must be a number from 0 to 1.
- If options or correctAnswer are not applicable, return {} for that field.
- Return ONLY the JSON object, no additional text.`;

    const callModel = async () => {
      if (this.provider === 'ollama') {
        return this._callOllama(prompt, this.buildOllamaOptions('question_generation'));
      }
      if (this.provider === 'nvidia') {
        return this._callNvidia(prompt);
      }
      if (this.provider === 'openrouter') {
        return this._callOpenRouter(prompt);
      }
      if (this.provider === 'deepseek') {
        return this._callDeepSeek(prompt);
      }
      if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        return resp.text();
      }
      if (this.provider === 'mock') {
        return JSON.stringify({
          diagnosis: {
            issues: [{ type: 'AMBIGUOUS_WORDING', description: 'Đề xuất mẫu dựa trên tỷ lệ trả lời sai cao.' }],
            reason: 'Câu hỏi có thể cần diễn đạt rõ hơn và các phương án gây nhiễu chặt chẽ hơn.',
          },
          suggestion: {
            content: String(original.content || original.stem || '').trim() || 'Nội dung câu hỏi đã cải thiện',
            options: original.options || {},
            correctAnswer: original.correctAnswer || original.answerKey || {},
            explanation: original.explanation || 'Giải thích được bổ sung để làm rõ đáp án đúng.',
            difficulty: Number(original.difficulty || 3),
          },
          changes: [
            {
              field: 'explanation',
              before: String(original.explanation || ''),
              after: original.explanation || 'Giải thích được bổ sung để làm rõ đáp án đúng.',
              reason: 'Giúp giảng viên và sinh viên dễ xem xét lại câu hỏi hơn.',
            },
          ],
          confidence: 0.72,
          warnings: [],
        });
      }
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    };

    try {
      let lastError: any = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const responseText = await callModel();
          const cleaned = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();
          const parsed = JSON.parse(cleaned);
          const suggestion = parsed?.suggestion || {};
          const content = String(suggestion.content || '').trim();
          if (!content || typeof parsed?.diagnosis !== 'object' || !Array.isArray(parsed?.changes)) {
            throw new Error('Định dạng phản hồi không hợp lệ: thiếu chẩn đoán, nội dung đề xuất hoặc danh sách thay đổi');
          }
          const difficulty = Math.max(1, Math.min(10, Math.round(Number(suggestion.difficulty || original.difficulty || 1))));
          return {
            diagnosis: {
              issues: Array.isArray(parsed.diagnosis?.issues) ? parsed.diagnosis.issues : [],
              reason: String(parsed.diagnosis?.reason || '').trim(),
            },
            suggestion: {
              content,
              options: suggestion.options && typeof suggestion.options === 'object' ? suggestion.options : {},
              correctAnswer: suggestion.correctAnswer && typeof suggestion.correctAnswer === 'object' ? suggestion.correctAnswer : {},
              explanation: String(suggestion.explanation || '').trim(),
              difficulty,
            },
            changes: parsed.changes.map((change: any) => ({
              field: String(change?.field || 'content'),
              before: String(change?.before ?? ''),
              after: String(change?.after ?? ''),
              reason: String(change?.reason || '').trim(),
            })),
            confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((item: any) => String(item)) : [],
          };
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    } catch (error: any) {
      this.logger.error('Failed to generate question improvement:', error);
      throw new Error(`Tạo nội dung bằng AI thất bại: ${error.message}`);
    }
  }

  async suggestSimilarTopics(params: {
    topicName: string;
    existingTopics: string[];
    language?: string;
    courseName?: string;
    context?: ExamTrustAiContext;
  }) {
    const topicName = String(params.topicName || '').trim();
    const existingTopics = Array.from(
      new Set((params.existingTopics || []).map((topic) => String(topic || '').trim()).filter(Boolean)),
    ).slice(0, 50);

    if (!topicName) {
      return { matches: [] };
    }

    this.logger.log(
      `Topic similarity check provider=${this.provider} topics=${existingTopics.length}`,
    );

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const heuristicMatches = existingTopics
      .map((candidate) => {
        const normalizedCandidate = normalize(candidate);
        const normalizedTopic = normalize(topicName);
        if (!normalizedCandidate || !normalizedTopic) {
          return { name: candidate, score: 0 };
        }

        let score = 0;
        if (normalizedCandidate === normalizedTopic) {
          score = 1;
        } else if (
          normalizedCandidate.includes(normalizedTopic) ||
          normalizedTopic.includes(normalizedCandidate)
        ) {
          score = 0.92;
        } else {
          const candidateTokens = new Set(normalizedCandidate.split(' '));
          const topicTokens = new Set(normalizedTopic.split(' '));
          let overlap = 0;
          topicTokens.forEach((token) => {
            if (candidateTokens.has(token)) overlap += 1;
          });
          const union = new Set([...candidateTokens, ...topicTokens]).size || 1;
          score = overlap / union;
        }

        return { name: candidate, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        score: Number(item.score.toFixed(2)),
        reason: 'Độ tương đồng ước lượng dựa trên nội dung tên chủ đề',
      }));

    const prompt = `${buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'topic_matching',
      language: params.language || this.defaultLanguage,
      questionType: 'TOPIC_MATCHING',
      questionCount: 1,
      context: {
        courseName: params.courseName,
        topicName,
        existingTopics,
        ...(params.context || {}),
      },
    })}

You are helping a lecturer find an existing topic similar to a proposed new topic.
Proposed topic: "${topicName}"

Existing topics:
${existingTopics.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Return ONLY JSON in this exact structure:
{
  "matches": [
    {
      "name": "closest existing topic name",
      "score": 0.0,
      "reason": "short reason"
    }
  ]
}

Rules:
- Only include topics that are genuinely similar to the proposed topic.
- Sort from most similar to least similar.
- Score must be a number between 0 and 1.
- Return at most 5 matches.
- If nothing is similar, return an empty matches array.`;

    try {
      let responseText: string | null = null;

      if (this.provider === 'ollama') {
        responseText = await this._callOllama(
          prompt,
          this.buildOllamaOptions('topic_matching'),
        );
      } else if (this.provider === 'nvidia') {
        responseText = await this._callNvidia(prompt);
      } else if (this.provider === 'openrouter') {
        responseText = await this._callOpenRouter(prompt);
      } else if (this.provider === 'deepseek') {
        responseText = await this._callDeepSeek(prompt);
      } else if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        responseText = await resp.text();
      } else if (this.provider === 'mock') {
        responseText = JSON.stringify({ matches: heuristicMatches });
      } else if (this.model) {
        const result = await this.model.generateContent(prompt);
        responseText = result.response.text();
      }

      if (!responseText) {
        return { matches: heuristicMatches };
      }

      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const matches = Array.isArray(parsed.matches) ? parsed.matches : [];

      const normalized = matches
        .map((item: any) => ({
          name: String(item?.name || '').trim(),
          score: Math.max(0, Math.min(1, Number(item?.score ?? 0))),
          reason: String(item?.reason || 'AI xác nhận tương đồng').trim(),
        }))
        .filter((item: any) => item.name)
        .sort((a: any, b: any) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 5);

      return { matches: normalized.length > 0 ? normalized : heuristicMatches };
    } catch (error: any) {
      this.logger.warn(`Falling back to heuristic topic matching: ${error.message}`);
      return { matches: heuristicMatches };
    }
  }

  async suggestEssayGrade(params: {
    questionText: string;
    studentAnswer: string;
    maxPoints: number;
    referenceAnswer?: string;
    explanation?: string;
    language?: string;
    context?: ExamTrustAiContext;
  }) {
    const maxPoints = Math.max(0, Number(params.maxPoints) || 0);
    const language = params.language || this.defaultLanguage;
    const langInstruction = language === 'vi'
      ? 'Write the summary and gap/strength notes in Vietnamese.'
      : 'Write the summary and gap/strength notes in English.';

    const prompt = `${buildExamTrustPromptHeader({
      appName: this.appName,
      useCase: 'grading_support',
      language,
      questionType: 'ESSAY',
      context: params.context || {},
    })}
${langInstruction}

You are helping a lecturer grade a student's essay/short-answer response. You must produce a suggestion only — the lecturer always makes the final grading decision.

Question:
${params.questionText}

${params.referenceAnswer ? `Reference/model answer:\n${params.referenceAnswer}\n` : ''}${params.explanation ? `Grading notes/explanation:\n${params.explanation}\n` : ''}
Student's answer:
${params.studentAnswer || '(empty answer)'}

Maximum points for this question: ${maxPoints}

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "short neutral summary of what the student's answer actually says",
  "strengths": ["string"],
  "gaps": ["string"],
  "suggestedPoints": 0,
  "confidence": 0.0
}

Rules:
- "summary" must reflect only what is written in the student's answer, not what the ideal answer should contain.
- "suggestedPoints" must be a number between 0 and ${maxPoints}.
- "confidence" must be a number between 0 and 1.
- If the answer is empty or unrelated to the question, suggestedPoints must be 0.
- Return ONLY the JSON object, no additional text.`;

    const callModel = async () => {
      if (this.provider === 'ollama') {
        return this._callOllama(prompt, this.buildOllamaOptions('grading_support'));
      }
      if (this.provider === 'nvidia') {
        return this._callNvidia(prompt);
      }
      if (this.provider === 'openrouter') {
        return this._callOpenRouter(prompt);
      }
      if (this.provider === 'deepseek') {
        return this._callDeepSeek(prompt);
      }
      if (this.provider === 'local' && this.localUrl) {
        const resp = await fetch(this.localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!resp.ok) throw new Error(`Máy chủ mô hình cục bộ trả về mã lỗi ${resp.status}`);
        return resp.text();
      }
      if (this.provider === 'mock') {
        return JSON.stringify({
          summary: String(params.studentAnswer || '').slice(0, 200) || 'Sinh viên chưa trả lời câu hỏi này.',
          strengths: [],
          gaps: [],
          suggestedPoints: 0,
          confidence: 0.3,
        });
      }
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    };

    try {
      const responseText = await callModel();
      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        summary: String(parsed?.summary || '').trim(),
        strengths: Array.isArray(parsed?.strengths) ? parsed.strengths.map((item: any) => String(item)) : [],
        gaps: Array.isArray(parsed?.gaps) ? parsed.gaps.map((item: any) => String(item)) : [],
        suggestedPoints: Math.max(0, Math.min(maxPoints, Number(parsed?.suggestedPoints) || 0)),
        confidence: Math.max(0, Math.min(1, Number(parsed?.confidence) || 0)),
      };
    } catch (error: any) {
      this.logger.warn(`Essay grade suggestion failed, returning neutral fallback: ${error.message}`);
      return {
        summary: '',
        strengths: [],
        gaps: [],
        suggestedPoints: 0,
        confidence: 0,
      };
    }
  }

  private async _callOllama(prompt: string, options?: Partial<OllamaGenerationOptions>): Promise<string> {
    const url = `${this.ollamaUrl}/api/generate`;
    const startedAt = Date.now();
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: options?.temperature ?? this.ollamaTemperature,
          top_p: options?.top_p ?? this.ollamaTopP,
          repeat_penalty: options?.repeat_penalty ?? this.ollamaRepeatPenalty,
          num_ctx: options?.num_ctx ?? this.ollamaNumCtx,
        },
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Ollama trả về mã lỗi ${resp.status}: ${body}`);
    }
    const data: any = await resp.json();
    this.logger.log(
      `Ollama generation completed model=${this.ollamaModel} duration=${Date.now() - startedAt}ms`,
    );
    return data.response || data.choices?.[0]?.text || '';
  }

  /**
   * Sends evidence to a self-hosted Ollama instance. The image remains on the
   * application network; no third-party API key or external upload is used.
   */
  private async _callOllamaVision(prompt: string, image: Buffer, model: string): Promise<string> {
    const startedAt = Date.now();
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        images: [image.toString('base64')],
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          top_p: this.ollamaTopP,
          num_ctx: this.ollamaNumCtx,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama (vision) trả về mã lỗi ${response.status}: ${body}`);
    }
    const payload: any = await response.json();
    this.logger.log(`Ollama vision completed model=${model} duration=${Date.now() - startedAt}ms`);
    return String(payload.response || payload.choices?.[0]?.text || '');
  }

  private async _callNvidia(prompt: string): Promise<string> {
    const completion = await this.nvidiaAI.chat.completions.create({
      model: this.nvidiaModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      top_p: 1,
      max_tokens: 16384,
      seed: 42,
      stream: true,
    });

    let text = '';
    for await (const chunk of completion as any) {
      text += chunk.choices?.[0]?.delta?.content || '';
    }
    return text;
  }

  private async _callOpenRouter(prompt: string): Promise<string> {
    const reasoningEnabled = String(this.configService.get<string>('AI_OPENROUTER_REASONING_ENABLED') || '')
      .toLowerCase() === 'true';
    const request: any = {
      model: this.openRouterModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      seed: 42,
      stream: true,
    };

    if (reasoningEnabled) {
      request.reasoning = {
        enabled: true,
        exclude: true,
      };
    }

    const completion = await this.openRouterAI.chat.completions.create(request);

    let text = '';
    for await (const chunk of completion as any) {
      text += chunk.choices?.[0]?.delta?.content || '';
      const reasoningTokens = chunk.usage?.completionTokensDetails?.reasoningTokens
        ?? chunk.usage?.completion_tokens_details?.reasoning_tokens;
      if (typeof reasoningTokens !== 'undefined') {
        this.logger.debug(`OpenRouter reasoning tokens: ${reasoningTokens}`);
      }
    }
    return text;
  }

  private async _callDeepSeek(prompt: string): Promise<string> {
    const completion = await this.deepseekAI.chat.completions.create({
      model: this.deepseekModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true,
    });

    let text = '';
    for await (const chunk of completion as any) {
      text += chunk.choices?.[0]?.delta?.content || '';
    }
    return text;
  }

  private buildOllamaOptions(useCase: 'question_generation' | 'exam_generation' | 'topic_matching' | 'grading_support') {
    return getOllamaGenerationOptions(useCase);
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      MULTIPLE_CHOICE: 'multiple choice (4 options, single correct answer)',
      MULTI_SELECT: 'multiple select (4 options, multiple correct answers)',
      TRUE_FALSE: 'true/false',
      SHORT_ANSWER: 'short answer',
      ESSAY: 'essay',
      FILL_IN_BLANK: 'fill in the blank',
      MATCHING: 'matching (4 left-right pairs to match)',
      ORDERING: 'ordering (4 items to arrange in the correct sequence)',
      FIND_ERROR: 'find the error (identify the bug in a short code/text snippet)',
    };
    return labels[type] || 'multiple choice';
  }

  private getOptionsInstruction(type: string): string {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return '"options": {"A": "option text", "B": "option text", "C": "option text", "D": "option text"},\n  "correctAnswer": {"answer": "B"}';
      case 'FIND_ERROR':
        return '"options": {"A": "int x = 1;", "B": "int y = 2", "C": "int z = 3;", "D": "return x + z;"},\n  "correctAnswer": {"answer": "B"}';
      case 'TRUE_FALSE':
        return '"options": {"A": "True", "B": "False"},\n  "correctAnswer": {"answer": "A"}';
      case 'ESSAY':
      case 'SHORT_ANSWER':
        return '"correctAnswer": {"answer": "expected answer guideline"}';
      case 'FILL_IN_BLANK':
        return '';
      case 'MATCHING':
        return '"pairs": [{"left": "term or item", "right": "matching definition or counterpart"}, {"left": "...", "right": "..."}, {"left": "...", "right": "..."}, {"left": "...", "right": "..."}]';
      case 'ORDERING':
        return '"items": ["first step or item, in the correct order", "second step or item", "third step or item", "fourth step or item"]';
      default:
        return '"options": {"A": "option text", "B": "option text", "C": "option text", "D": "option text"},\n  "correctAnswer": {"answer": "B"}';
    }
  }

  private async safeJsonParse(text: string): Promise<any> {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      try {
        const { jsonrepair } = await import('jsonrepair');
        const repaired = (jsonrepair as (input: string) => string)(cleaned);
        return JSON.parse(repaired);
      } catch {
        throw new Error('AI trả về JSON không hợp lệ. Vui lòng thử lại với prompt khác.');
      }
    }
  }

  private normalizeQuestionType(type?: string): string {
    if (!type) return 'MIXED';

    const normalized = String(type).trim().toUpperCase();
    const map: Record<string, string> = {
      MIXED: 'MIXED',
      CUSTOM: 'MIXED',
      MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
      SINGLE_CHOICE: 'MULTIPLE_CHOICE',
      MULTI_SELECT: 'MULTI_SELECT',
      TRUE_FALSE: 'TRUE_FALSE',
      SHORT_ANSWER: 'SHORT_ANSWER',
      ESSAY: 'ESSAY',
      FILL_IN_BLANK: 'FILL_IN_BLANK',
      MATCHING: 'MATCHING',
      ORDERING: 'ORDERING',
      FIND_ERROR: 'FIND_ERROR',
      'SINGLE-CHOICE': 'MULTIPLE_CHOICE',
      'MULTIPLE-CHOICE': 'MULTIPLE_CHOICE',
      'TRUE-FALSE': 'TRUE_FALSE',
      'SHORT-ANSWER': 'SHORT_ANSWER',
      'FILL-BLANK': 'FILL_IN_BLANK',
      'FIND-ERROR': 'FIND_ERROR',
    };

    return map[normalized] || 'MIXED';
  }
}
