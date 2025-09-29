// tests/auth/auth.routes.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// ====== Mocks definidos antes, para reusar referencias en asserts ======
const loginWithGitHubMock = jest.fn((req, res) => res.status(200).send('Login OK'));
const githubCallbackMock = jest.fn((req, res) => res.status(200).send('Callback OK'));
const getProfileMock = jest.fn((req, res) => res.status(200).send('Profile OK'));
const logoutMock = jest.fn((req, res) => res.status(200).send('Logout OK'));

const passportAuthenticateMock = jest.fn(() => (req, res, next) => next());
const requireAuthMock = jest.fn((req, res, next) => next());

// ====== Mockear módulos ANTES de importarlos ======
await jest.unstable_mockModule('../../src/modules/auth/controller/auth.controller.js', () => ({
  loginWithGitHub: loginWithGitHubMock,
  githubCallback: githubCallbackMock,
  getProfile: getProfileMock,
  logout: logoutMock,
}));

await jest.unstable_mockModule('passport', () => ({
  default: { authenticate: passportAuthenticateMock },
  authenticate: passportAuthenticateMock,
}));

await jest.unstable_mockModule('../../src/shared/middlewares/auth.middleware.js', () => ({
  default: requireAuthMock, // el middleware se importa como default en tu código
}));

// ====== Importar después de mockear ======
const authRouter = (await import('../../src/modules/auth/routes/auth.routes.js')).default;
// (opcional) importar para asserts explícitos de llamadas:
await import('../../src/modules/auth/controller/auth.controller.js'); // ya está mockeado

// ====== App mínima para probar rutas ======
const buildApp = () => {
  const app = express();
  app.use('/', authRouter);
  return app;
};

describe('Auth Routes Unit Tests', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /github should call loginWithGitHub controller', async () => {
    const res = await request(app).get('/github');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Login OK');
    expect(loginWithGitHubMock).toHaveBeenCalled();
    // No afirmamos passport aquí; el router llama al controller mockeado.
  });

  it('GET /github/callback should call githubCallback controller', async () => {
    const res = await request(app).get('/github/callback');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Callback OK');
    expect(githubCallbackMock).toHaveBeenCalled();
  });

  it('GET /me should call requireAuth middleware and getProfile controller', async () => {
    const res = await request(app).get('/me');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Profile OK');
    expect(requireAuthMock).toHaveBeenCalled();
    expect(getProfileMock).toHaveBeenCalled();
  });

  it('GET /logout should call logout controller', async () => {
    const res = await request(app).get('/logout');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Logout OK');
    expect(logoutMock).toHaveBeenCalled();
  });
});
