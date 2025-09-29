import * as eventsService from '../service/events.service.js';

// Handler para la ruta de listado de eventos
export const listEvents = async (req, res) => {
  try {
    // Preparamos los datos de la solicitud
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

    // Llamamos al servicio (la lógica de negocio)
    const result = await eventsService.searchEvents(filters, pagination);
    
    // Enviamos la respuesta
    return res.json(result);
  } catch (err) {
    console.error('Error al listar eventos:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};

// Handler para la ruta de obtener un evento por ID
export const getEventById = async (req, res) => {
  try {
    // Preparamos los datos de la solicitud
    const id = req.params.id;
    const includePayload = (req.query.include || '').split(',').includes('payload');

    // Llamamos al servicio (la lógica de negocio)
    const e = await eventsService.getEventById(id, includePayload);

    // Manejo de la respuesta
    if (!e) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Enviamos la respuesta
    return res.json(e);
  } catch (err) {
    console.error('Error al obtener evento:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};