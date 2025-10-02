import * as eventsService from '../service/events.service.js';

// Handler para la ruta de listado de eventos
export const listEvents = async (req, res) => {
  try {
    // Usamos destructuring para extraer los parámetros de forma más limpia
    const { 
      user, repo, type, action, since, until, processed, 
      page, limit, sort = 'received_at:desc' 
    } = req.query;
    
    // Creamos los objetos de configuración para el servicio
    const filters = { user, repo, type, action, since, until, processed };
    const pagination = { page, limit, sort };

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