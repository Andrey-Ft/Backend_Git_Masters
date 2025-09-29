// tests/webhooks/webhook.routes.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// mock del controller
const handleGitHubWebhookMock = jest.fn((req, res) =>
  res.status(202).send('ok')
);

// mock del verificador de firma (middleware)
const verifyGitHubSignatureMock = jest.fn((req, res, next) => next());

await jest.unstable_mockModule(
  '../../src/modules/webhooks/controller/webhook.controller.js',
  () => ({ handleGitHubWebhook: handleGitHubWebhookMock })
);

await jest.unstable_mockModule(
  '../../src/shared/middlewares/githubWebhookVerifier.js',
  () => ({ default: verifyGitHubSignatureMock })
);

// importar router después de mockear
const webhookRouter = (await import(
  '../../src/modules/webhooks/routes/webhook.routes.js'
)).default;

// app mínima
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/webhooks', webhookRouter);
  return app;
};

describe('Webhook Routes', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /webhooks/github pasa por verificador y llega al controller', async () => {
    const res = await request(app)
      .post('/webhooks/github')
      .send({ hello: 'world' });

    expect(verifyGitHubSignatureMock).toHaveBeenCalled();
    expect(handleGitHubWebhookMock).toHaveBeenCalled();
    expect(res.statusCode).toBe(202);
    expect(res.text).toBe('ok');
  });

  it('si verificador corta la cadena, no llega al controller', async () => {
    verifyGitHubSignatureMock.mockImplementationOnce((req, res, next) =>
      res.status(401).send('bad signature')
    );

    const res = await request(app).post('/webhooks/github').send({});

    expect(verifyGitHubSignatureMock).toHaveBeenCalled();
    expect(handleGitHubWebhookMock).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('bad signature');
  });
});
