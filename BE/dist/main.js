"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const perf_interceptor_1 = require("./common/interceptors/perf.interceptor");
function parseCsvList(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const defaultOrigins = ['http://localhost:3000'];
    const frontendUrl = process.env.FRONTEND_URL?.trim();
    const appBaseUrl = process.env.APP_BASE_URL?.trim();
    const corsOrigins = Array.from(new Set([
        ...defaultOrigins,
        ...parseCsvList(process.env.CORS_ORIGINS),
        ...(frontendUrl ? [frontendUrl] : []),
        ...(appBaseUrl ? [appBaseUrl] : []),
    ]));
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new perf_interceptor_1.PerfInterceptor());
    app.setGlobalPrefix('api');
    const httpAdapter = app.getHttpAdapter();
    const expressInstance = httpAdapter && httpAdapter.getInstance ? httpAdapter.getInstance() : null;
    if (expressInstance && typeof expressInstance.set === 'function') {
        expressInstance.set('trust proxy', true);
    }
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('ExamTrust API')
        .setDescription('Academic Trust Suite – REST API documentation')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'access-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 ExamTrust API running on http://localhost:${port}/api`);
    console.log(`📖 Swagger docs    → http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map