// tests/webhooks/webhook.controller.test.js
import { jest } from '@jest/globals';

// --- silenciar logs ruidosos ---
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

// --- mock del service ANTES de importar controller ---
const processGitHubEventMock = jest.fn();

await jest.unstable_mockModule(
  '../../src/modules/webhooks/service/webhook.service.js',
  () => ({ processGitHubEvent: processGitHubEventMock })
);

// importar controller después de mockear
const { handleGitHubWebhook } = await import(
  '../../src/modules/webhooks/controller/webhook.controller.js'
);

// helpers
const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const makeReq = ({ headers = {}, body = {} } = {}) => ({
  headers,
  body,
});

describe('Webhook Controller: handleGitHubWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('400 si faltan headers requeridos', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();

    await handleGitHubWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Faltan headers requeridos.' });
    expect(processGitHubEventMock).not.toHaveBeenCalled();
  });

  it('200 ping recibido', async () => {
    const req = makeReq({
      headers: { 'x-github-delivery': 'd1', 'x-github-event': 'ping' },
      body: { zen: 'Keep it logically awesome.' },
    });
    const res = makeRes();

    processGitHubEventMock.mockResolvedValue({ status: 'ping_received' });

    await handleGitHubWebhook(req, res);

    expect(processGitHubEventMock).toHaveBeenCalledWith(req.body, 'd1', 'ping');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Ping recibido.');
  });

  it('200 duplicado ignorado', async () => {
    const req = makeReq({
      headers: { 'x-github-delivery': 'd2', 'x-github-event': 'push' },
      body: { repository: { full_name: 'user/repo' } },
    });
    const res = makeRes();

    processGitHubEventMock.mockResolvedValue({ status: 'duplicate_event' });

    await handleGitHubWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Webhook duplicado, ignorado.');
  });

  it('202 aceptado para procesamiento', async () => {
    const req = makeReq({
      headers: { 'x-github-delivery': 'd3', 'x-github-event': 'push' },
      body: { pusher: { name: 'anderson' } },
    });
    const res = makeRes();

    processGitHubEventMock.mockResolvedValue({
      status: 'event_processed',
      event: { delivery_id: 'd3' },
    });

    await handleGitHubWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledWith('Webhook aceptado para procesamiento.');
  });

  it('500 si el service lanza error', async () => {
    const req = makeReq({
      headers: { 'x-github-delivery': 'd4', 'x-github-event': 'push' },
      body: {},
    });
    const res = makeRes();

    processGitHubEventMock.mockRejectedValue(new Error('boom'));

    await handleGitHubWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});
