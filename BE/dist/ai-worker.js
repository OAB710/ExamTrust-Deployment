"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const ai_worker_module_1 = require("./ai-worker.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(ai_worker_module_1.AiWorkerModule, {
        logger: ['log', 'warn', 'error'],
    });
    const shutdown = async () => {
        await app.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    console.log('AI worker started and waiting for queued jobs.');
}
bootstrap().catch((error) => {
    console.error('Failed to start AI worker:', error);
    process.exit(1);
});
//# sourceMappingURL=ai-worker.js.map