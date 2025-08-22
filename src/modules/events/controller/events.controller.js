import eventStore from '../../../shared/persistence/eventStore.js';

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (k in obj) {
      out[k] = obj[k];
    }
  }
  return out;
}

function mapPublicItem(e, includePayload = false) {
  const base = pick(e, [
    'id', 'delivery_id', 'event_type', 'action', 'repo_full_name', 'sender_login',
    'commits_count', 'github_created_at', 'received_at', 'processed_status'
  ]);
  if (includePayload) {
    base.payload = e.payload;
  }
  return base;
}

export const listEvents = async (req, res) => {
  try {
    const filters = {
      user: req.query.user,
      repo: req.query.repo,
      type: req.query.type,
      action: req.query.action,
      since: req.query.since,
      until: req.query.until,
      processed: req.query.processed,
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort || 'received_at:desc',
    };

    const { total, page, limit, items } = await eventStore.search(filters, pagination);
    return res.json({
      page,
      limit,
      total,
      items: items.map(e => mapPublicItem(e, false))
    });
  } catch (err) {
    console.error('Error al listar eventos:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const id = req.params.id;
    const includePayload = (req.query.include || '').split(',').includes('payload');
    const e = await eventStore.findById(id);
    if (!e) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(mapPublicItem(e, includePayload));
  } catch (err) {
    console.error('Error al obtener evento:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};