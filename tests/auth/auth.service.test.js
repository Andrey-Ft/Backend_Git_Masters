// tests/auth/auth.service.test.js
import { jest } from '@jest/globals';

// ====== Mocks ======
const jwtSignMock = jest.fn();
const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
};

// Mockear jsonwebtoken
await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jwtSignMock },
  sign: jwtSignMock,
}));

// Mockear @prisma/client porque el servicio instancia new PrismaClient()
await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Importar después de mockear
const { generateAndSetToken, getCompleteProfile, cleanupSession } = await import(
  '../../src/modules/auth/service/auth.service.js'
);
const jwt = (await import('jsonwebtoken')).default;

// ====== Helpers ======
const makeRes = () => {
  const res = {};
  res.cookie = jest.fn(() => res);
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  return res;
};

const makeReq = (overrides = {}) => ({
  logout: jest.fn((cb) => cb && cb()),
  session: {
    destroy: jest.fn((cb) => cb && cb(null)),
  },
  ...overrides,
});

// ====== Tests ======
describe('Auth Service Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = makeReq();
    res = makeRes();
    next = jest.fn();
    jwtSignMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateAndSetToken', () => {
    it('should sign a JWT and set it as a cookie', () => {
      const user = { id: '1', displayName: 'Test User' };
      jwtSignMock.mockReturnValue('fake-token');

      generateAndSetToken(res, user);

      expect(jwtSignMock).toHaveBeenCalledWith(user, 'test-secret', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('token', 'fake-token', expect.objectContaining({ httpOnly: true }));
    });
  });

  describe('getCompleteProfile', () => {
    it('should return formatted profile data if the user is found', async () => {
      const mockUserData = {
        id: 'u1',
        displayName: 'Wey',
        pointsBalance: 100,
        profile: { level: 5 },
        assignedBadges: [{ badge: { name: 'test-badge', description: 'a test badge' } }],
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUserData);

      const profile = await getCompleteProfile('github-id-123');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { githubId: 'github-id-123' } })
      );
      expect(profile).toEqual({
        points: 100,
        level: 5,
        badges: [{ name: 'test-badge', description: 'a test badge' }],
      });
    });

    it('should return null if the user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const profile = await getCompleteProfile('non-existent-id');
      expect(profile).toBeNull();
    });
  });

  describe('cleanupSession', () => {
    it('should clear the session and cookie and send a success response', () => {
      cleanupSession(req, res, next);

      expect(req.logout).toHaveBeenCalled();
      expect(req.session.destroy).toHaveBeenCalled();

      // Tu implementación limpia 'connect.sid' con opciones
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      // Ajusta el mensaje para que coincida con tu servicio real:
      expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada exitosamente.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return a 500 error if session destruction fails', () => {
      req.session.destroy.mockImplementation((cb) => cb && cb(new Error('destroy error')));

      cleanupSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'No se pudo cerrar la sesión.' });
    });
  });
});
