// tests/events/events.controller.test.js
import { jest } from '@jest/globals';

// --- Mocks del service (antes de importar controller) ---
const searchEventsMock = jest.fn();
const getEventByIdMock = jest.fn();

await jest.unstable_mockModule('../../src/modules/events/service/events.service.js', () => ({
  searchEvents: searchEventsMock,
  getEventById: getEventByIdMock,
}));

// --- Importar controller después de mockear ---
const { listEvents, getEventById } = await import(
  '../../src/modules/events/controller/events.controller.js'
);

// Helpers res/req
const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (overrides = {}) => ({ ...overrides });

describe('Events Controller', () => {
  // 🔇 Silenciar logs de error en todos los tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listEvents', () => {
    it('debe llamar al service con filtros y paginación y responder 200', async () => {
      const req = makeReq({
        query: {
          user: 'anderson',
          repo: 'git-masters',
          type: 'PushEvent',
          action: 'create',
          since: '2025-08-01',
          until: '2025-08-26',
          processed: 'true',
          page: '2',
          limit: '25',
          sort: 'received_at:asc',
        },
      });
      const res = makeRes();

      const mockResult = { page: 2, limit: 25, total: 1, items: [{ id: 'e1' }] };
      searchEventsMock.mockResolvedValue(mockResult);

      await listEvents(req, res);

      expect(searchEventsMock).toHaveBeenCalledWith(
        {
          user: 'anderson',
          repo: 'git-masters',
          type: 'PushEvent',
          action: 'create',
          since: '2025-08-01',
          until: '2025-08-26',
          processed: 'true',
        },
        { page: '2', limit: '25', sort: 'received_at:asc' }
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('usa sort por defecto cuando no viene en query', async () => {
      const req = makeReq({ query: {} });
      const res = makeRes();
      searchEventsMock.mockResolvedValue({ page: 1, limit: 10, total: 0, items: [] });

      await listEvents(req, res);

      expect(searchEventsMock).toHaveBeenCalledWith(
        {
          user: undefined,
          repo: undefined,
          type: undefined,
          action: undefined,
          since: undefined,
          until: undefined,
          processed: undefined,
        },
        { page: undefined, limit: undefined, sort: 'received_at:desc' }
      );
      expect(res.json).toHaveBeenCalledWith({ page: 1, limit: 10, total: 0, items: [] });
    });

    it('maneja error con 500', async () => {
      const req = makeReq({ query: {} });
      const res = makeRes();
      searchEventsMock.mockRejectedValue(new Error('boom'));

      await listEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal error' });
    });
  });

  describe('getEventById', () => {
    it('devuelve 200 con el evento (sin payload por defecto)', async () => {
      const req = makeReq({ params: { id: 'abc' }, query: {} });
      const res = makeRes();
      getEventByIdMock.mockResolvedValue({ id: 'abc', event_type: 'PushEvent' });

      await getEventById(req, res);

      expect(getEventByIdMock).toHaveBeenCalledWith('abc', false);
      expect(res.json).toHaveBeenCalledWith({ id: 'abc', event_type: 'PushEvent' });
    });

    it('incluye payload cuando include=payload', async () => {
      const req = makeReq({ params: { id: 'abc' }, query: { include: 'meta,payload' } });
      const res = makeRes();
      getEventByIdMock.mockResolvedValue({ id: 'abc', payload: { x: 1 } });

      await getEventById(req, res);

      expect(getEventByIdMock).toHaveBeenCalledWith('abc', true);
      expect(res.json).toHaveBeenCalledWith({ id: 'abc', payload: { x: 1 } });
    });

    it('devuelve 404 si no existe', async () => {
      const req = makeReq({ params: { id: 'nope' }, query: {} });
      const res = makeRes();
      getEventByIdMock.mockResolvedValue(null);

      await getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('maneja error con 500', async () => {
      const req = makeReq({ params: { id: 'abc' }, query: {} });
      const res = makeRes();
      getEventByIdMock.mockRejectedValue(new Error('boom'));

      await getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal error' });
    });
  });
});
