// tests/auth/auth.controller.test.js
import { jest } from '@jest/globals';

// ====== ENV para redirects ======
beforeAll(() => {
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
});

// ====== Mocks (hechos ANTES de importar módulos) ======
const passportAuthenticateMock = jest.fn(() => (req, res, next) => next());
await jest.unstable_mockModule('passport', () => ({
  // compat CJS->ESM: export por defecto y named
  default: { authenticate: passportAuthenticateMock },
  authenticate: passportAuthenticateMock,
}));

const generateAndSetTokenMock = jest.fn();
const getCompleteProfileMock = jest.fn();
const cleanupSessionMock = jest.fn();

await jest.unstable_mockModule(
  '../../src/modules/auth/service/auth.service.js',
  () => ({
    generateAndSetToken: generateAndSetTokenMock,
    getCompleteProfile: getCompleteProfileMock,
    cleanupSession: cleanupSessionMock,
  })
);

// ====== Importar después de mockear ======
const passport = (await import('passport')).default;
const {
  loginWithGitHub,
  githubCallback,
  getProfile,
  logout,
} = await import('../../src/modules/auth/controller/auth.controller.js');

// ====== Helpers ======
const mockResponse = () => {
  const res = {};
  res.redirect = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const mockRequest = (overrides = {}) => ({
  user: { githubId: '123', displayName: 'Test User' },
  ...overrides,
});

// ====== Tests ======
describe('Auth Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('loginWithGitHub', () => {
  it('should behave like a middleware and call next()', () => {
    loginWithGitHub(req, res, next);
    expect(next).toHaveBeenCalled(); // nuestro mock de passport.authenticate devuelve (req,res,next)=>next()
  });
});


  describe('githubCallback', () => {
    it('should redirect to dashboard on successful authentication', () => {
      passport.authenticate.mockImplementationOnce(
        (strategy, options, cb) => (rq, rs, nx) => {
          cb(null, { githubId: '123', displayName: 'Test User' });
        }
      );

      githubCallback(req, res, next);

      expect(passport.authenticate).toHaveBeenCalled();
      expect(generateAndSetTokenMock).toHaveBeenCalledWith(res, {
        githubId: '123',
        displayName: 'Test User',
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/dashboard`
      );
    });

    it('should redirect to login-failed on authentication error', () => {
      passport.authenticate.mockImplementationOnce(
        (strategy, options, cb) => (rq, rs, nx) => {
          cb(new Error('Auth failed'), null);
        }
      );

      githubCallback(req, res, next);

      expect(passport.authenticate).toHaveBeenCalled();
      expect(generateAndSetTokenMock).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login-failed`
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile data from the service', async () => {
      const mockProfile = { points: 100, level: 5, badges: [] };
      getCompleteProfileMock.mockResolvedValue(mockProfile);

      await getProfile(req, res);

      expect(getCompleteProfileMock).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith({
        ...req.user,
        ...mockProfile,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = null;

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No autenticado' });
    });
  });

  describe('logout', () => {
    it('should call cleanupSession from the service', () => {
      logout(req, res, next);
      expect(cleanupSessionMock).toHaveBeenCalledWith(req, res, next);
    });
  });
});
