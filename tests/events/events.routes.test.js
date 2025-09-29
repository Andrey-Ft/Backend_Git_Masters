// tests/events/events.routes.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// --- ENV para bypass ---
beforeAll(() => {
  process.env.TEST_API_KEY = 'test-key-123';
});

// --- Mocks del controller (responden simple y dejan rastro) ---
const listEventsMock = jest.fn((req, res) => res.status(200).json({ ok: 'list' }));
const getEventByIdMock = jest.fn((req, res) => res.status(200).json({ ok: 'get' }));

await jest.unstable_mockModule('../../src/modules/events/controller/events.controller.js', () => ({
  listEvents: listEventsMock,
  getEventById: getEventByIdMock,
}));

// --- Mock del requireAuth: si lo llaman, responde 401 ---
const requireAuthMock = jest.fn((req, res, next) => res.status(401).send('No token'));
await jest.unstable_mockModule('../../src/shared/middlewares/auth.middleware.js', () => ({
  default: (...args) => requireAuthMock(...args),
}));

// Importar router ya con mocks aplicados
const eventsRouter = (await import('../../src/modules/events/routes/events.routes.js')).default;

// App mínima
const buildApp = () => {
  const app = express();
  app.use('/events', eventsRouter);
  return app;
};

describe('Events Routes', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bypassea auth con X-API-Key correcta (GET /events)', async () => {
    const res = await request(app).get('/events').set('X-API-Key', 'test-key-123');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: 'list' });
    expect(listEventsMock).toHaveBeenCalled();
    expect(requireAuthMock).not.toHaveBeenCalled(); // se saltó el auth
  });

  it('bypassea auth con X-API-Key correcta (GET /events/:id)', async () => {
    const res = await request(app).get('/events/abc').set('X-API-Key', 'test-key-123');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: 'get' });
    expect(getEventByIdMock).toHaveBeenCalled();
    expect(requireAuthMock).not.toHaveBeenCalled();
  });

  it('sin X-API-Key llama a requireAuth y devuelve 401', async () => {
    const res = await request(app).get('/events');
    expect(requireAuthMock).toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('No token');
    expect(listEventsMock).not.toHaveBeenCalled();
  });

  it('X-API-Key incorrecta llama a requireAuth y devuelve 401', async () => {
    const res = await request(app).get('/events').set('X-API-Key', 'bad-key');
    expect(requireAuthMock).toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(listEventsMock).not.toHaveBeenCalled();
  });
});
