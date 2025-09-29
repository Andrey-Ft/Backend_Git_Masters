// tests/webhooks/webhook.service.test.js
import { jest } from '@jest/globals';

// silenciar info/warn/error del service
beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.info.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
});

// mocks de dependencias del service
const prismaMock = {
  github_events: {
    create: jest.fn(),
  },
};

const runRulesForActivityMock = jest.fn(() => Promise.resolve());

await jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

await jest.unstable_mockModule(
  '../../src/modules/reglas-puntos/engine/ruleEngine.js',
  () => ({ runRulesForActivity: runRulesForActivityMock })
);

// importar service luego de mockear
const { processGitHubEvent } = await import(
  '../../src/modules/webhooks/service/webhook.service.js'
);

describe('Webhook Service: processGitHubEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna ping_received si githubEvent === "ping"', async () => {
    const out = await processGitHubEvent({}, 'd1', 'ping');
    expect(out).toEqual({ status: 'ping_received' });
    expect(prismaMock.github_events.create).not.toHaveBeenCalled();
    expect(runRulesForActivityMock).not.toHaveBeenCalled();
  });

  it('guarda el evento y retorna event_processed, lanza reglas en background', async () => {
    prismaMock.github_events.create.mockResolvedValue({
      id: 'e1',
      delivery_id: 'd2',
    });

    const payload = {
      repository: { full_name: 'user/repo' },
      pusher: { name: 'anderson' },
      action: 'opened',
    };

    const out = await processGitHubEvent(payload, 'd2', 'push');

    expect(prismaMock.github_events.create).toHaveBeenCalledWith({
      data: {
        delivery_id: 'd2',
        event_type: 'push',
        repo_full_name: 'user/repo',
        sender_login: 'anderson',
        action: 'opened',
        payload,
      },
    });
    expect(out).toEqual({ status: 'event_processed', event: { id: 'e1', delivery_id: 'd2' } });
    expect(runRulesForActivityMock).toHaveBeenCalledWith('d2');
  });

  it('retorna duplicate_event si Prisma lanza P2002 por delivery_id', async () => {
    const err = new Error('Unique constraint failed');
    err.code = 'P2002';
    err.meta = { target: ['delivery_id'] };

    prismaMock.github_events.create.mockRejectedValue(err);

    const out = await processGitHubEvent({}, 'dup123', 'push');

    expect(out).toEqual({ status: 'duplicate_event' });
    expect(runRulesForActivityMock).not.toHaveBeenCalled();
  });

  it('re-lanza error si no es P2002', async () => {
    const err = new Error('DB down');
    prismaMock.github_events.create.mockRejectedValue(err);

    await expect(processGitHubEvent({}, 'x', 'push')).rejects.toThrow('DB down');
  });

  it('cuando falta sender, usa pusher.name o null', async () => {
    prismaMock.github_events.create.mockResolvedValue({
      id: 'e2',
      delivery_id: 'd3',
    });

    const payload = {
      repository: { full_name: 'user/repo' },
      // sin sender, solo pusher
      pusher: { name: 'pusher-name' },
    };

    await processGitHubEvent(payload, 'd3', 'push');

    expect(prismaMock.github_events.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sender_login: 'pusher-name',
      }),
    });
  });
});
