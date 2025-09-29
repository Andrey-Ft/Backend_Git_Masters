// tests/events/events.service.test.js
import { jest } from '@jest/globals';

// Mock del eventStore usado por el service
const searchStoreMock = jest.fn();
const findByIdStoreMock = jest.fn();

await jest.unstable_mockModule('../../src/shared/persistence/eventStore.js', () => ({
  default: {
    search: searchStoreMock,
    findById: findByIdStoreMock,
  },
}));

// Importar después de mockear
const { searchEvents, getEventById } = await import(
  '../../src/modules/events/service/events.service.js'
);

describe('Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchEvents', () => {
    it('retorna items mapeados (sin payload) y paginación', async () => {
      searchStoreMock.mockResolvedValue({
        total: 2,
        page: 3,
        limit: 10,
        items: [
          {
            id: 'e1',
            delivery_id: 'd1',
            event_type: 'PushEvent',
            action: 'created',
            repo_full_name: 'user/repo',
            sender_login: 'anderson',
            commits_count: 2,
            github_created_at: '2025-08-20T10:00:00Z',
            received_at: '2025-08-20T10:01:00Z',
            processed_status: 'done',
            payload: { secret: 'no debe salir' },
          },
          {
            id: 'e2',
            delivery_id: 'd2',
            event_type: 'PullRequestEvent',
            action: 'opened',
            repo_full_name: 'user/repo',
            sender_login: 'anderson',
            commits_count: 1,
            github_created_at: '2025-08-21T10:00:00Z',
            received_at: '2025-08-21T10:01:00Z',
            processed_status: 'pending',
            payload: { any: 'data' },
          },
        ],
      });

      const filters = { user: 'anderson' };
      const pagination = { page: 3, limit: 10, sort: 'received_at:desc' };
      const out = await searchEvents(filters, pagination);

      expect(searchStoreMock).toHaveBeenCalledWith(filters, pagination);
      expect(out).toEqual({
        page: 3,
        limit: 10,
        total: 2,
        items: [
          {
            id: 'e1',
            delivery_id: 'd1',
            event_type: 'PushEvent',
            action: 'created',
            repo_full_name: 'user/repo',
            sender_login: 'anderson',
            commits_count: 2,
            github_created_at: '2025-08-20T10:00:00Z',
            received_at: '2025-08-20T10:01:00Z',
            processed_status: 'done',
          },
          {
            id: 'e2',
            delivery_id: 'd2',
            event_type: 'PullRequestEvent',
            action: 'opened',
            repo_full_name: 'user/repo',
            sender_login: 'anderson',
            commits_count: 1,
            github_created_at: '2025-08-21T10:00:00Z',
            received_at: '2025-08-21T10:01:00Z',
            processed_status: 'pending',
          },
        ],
      });
    });
  });

  describe('getEventById', () => {
    it('retorna evento sin payload por defecto', async () => {
      findByIdStoreMock.mockResolvedValue({
        id: 'e1',
        payload: { should: 'not appear' },
        event_type: 'PushEvent',
        action: 'created',
        repo_full_name: 'user/repo',
        sender_login: 'anderson',
        commits_count: 1,
        github_created_at: '2025-08-20T10:00:00Z',
        received_at: '2025-08-20T10:01:00Z',
        processed_status: 'done',
      });

      const e = await getEventById('e1');
      expect(findByIdStoreMock).toHaveBeenCalledWith('e1');
      expect(e).toEqual({
        id: 'e1',
        delivery_id: undefined,
        event_type: 'PushEvent',
        action: 'created',
        repo_full_name: 'user/repo',
        sender_login: 'anderson',
        commits_count: 1,
        github_created_at: '2025-08-20T10:00:00Z',
        received_at: '2025-08-20T10:01:00Z',
        processed_status: 'done',
      });
    });

    it('incluye payload cuando includePayload = true', async () => {
      findByIdStoreMock.mockResolvedValue({
        id: 'e1',
        payload: { keep: 'me' },
        event_type: 'PushEvent',
        action: 'created',
        repo_full_name: 'user/repo',
        sender_login: 'anderson',
        commits_count: 1,
        github_created_at: '2025-08-20T10:00:00Z',
        received_at: '2025-08-20T10:01:00Z',
        processed_status: 'done',
      });

      const e = await getEventById('e1', true);
      expect(e.payload).toEqual({ keep: 'me' });
    });

    it('retorna null si no existe', async () => {
      findByIdStoreMock.mockResolvedValue(null);
      const e = await getEventById('nope');
      expect(e).toBeNull();
    });
  });
});
