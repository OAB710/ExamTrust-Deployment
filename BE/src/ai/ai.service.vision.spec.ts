import { AiService } from './ai.service';

const buildConfigService = (values: Record<string, string>) => ({
  get: (key: string) => values[key],
});

describe('AiService.analyzeProctoringImage', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the configured local Ollama vision model and normalizes advisory tags', async () => {
    const service = new AiService(buildConfigService({
      AI_PROVIDER: 'ollama',
      AI_OLLAMA_URL: 'http://ollama.test',
      AI_OLLAMA_VISION_MODEL: 'moondream',
    }) as any);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ response: '{"tags":[{"tag":"FACE_NOT_VISIBLE","confidence":1.2,"note":"Face not visible"},{"tag":"UNSUPPORTED","confidence":1,"note":"Ignore"}]}' }),
    } as any);

    const result = await service.analyzeProctoringImage({ image: Buffer.from('frame'), mimeType: 'image/jpeg' });

    expect(result).toEqual({ tags: [{ tag: 'FACE_NOT_VISIBLE', confidence: 1, note: 'Face not visible' }], model: 'moondream' });
    expect(fetchSpy).toHaveBeenCalledWith('http://ollama.test/api/generate', expect.objectContaining({ method: 'POST' }));
    const request = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(request).toMatchObject({ model: 'moondream', stream: false, format: 'json', images: [Buffer.from('frame').toString('base64')] });
  });

  it('retries the configured fallback model after the primary vision model fails', async () => {
    const service = new AiService(buildConfigService({
      AI_PROVIDER: 'ollama',
      AI_OLLAMA_URL: 'http://ollama.test',
      AI_OLLAMA_VISION_MODEL: 'gemma3:4b',
      AI_OLLAMA_VISION_FALLBACK_MODEL: 'moondream',
    }) as any);
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'model not found' } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: '{"tags":[]}' }) } as any);

    await expect(service.analyzeProctoringImage({ image: Buffer.from('frame'), mimeType: 'image/jpeg' }))
      .resolves.toEqual({ tags: [], model: 'moondream' });
    const fallbackRequest = JSON.parse(String(fetchSpy.mock.calls[1][1]?.body));
    expect(fallbackRequest.model).toBe('moondream');
  });

  it('keeps mock mode free of any model request', async () => {
    const service = new AiService(buildConfigService({ AI_PROVIDER: 'mock' }) as any);
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(service.analyzeProctoringImage({ image: Buffer.from('frame'), mimeType: 'image/jpeg' })).resolves.toEqual({ tags: [], model: 'mock' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
