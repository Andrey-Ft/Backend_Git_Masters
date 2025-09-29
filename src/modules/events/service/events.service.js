import eventStore from '../../../shared/persistence/eventStore.js';

// Función utilitaria para seleccionar propiedades del objeto
function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (k in obj) {
      out[k] = obj[k];
    }
  }
  return out;
}

// Mapeo de datos para la respuesta pública
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

/**
 * Servicio para buscar eventos con filtros y paginación.
 * @param {object} filters - Objeto con los filtros de búsqueda.
 * @param {object} pagination - Objeto con los parámetros de paginación.
 * @returns {Promise<object>} - Datos de los eventos y la paginación.
 */
export async function searchEvents(filters, pagination) {
  const { total, page, limit, items } = await eventStore.search(filters, pagination);
  return {
    page,
    limit,
    total,
    items: items.map(e => mapPublicItem(e, false))
  };
}

/**
 * Servicio para obtener un evento por su ID.
 * @param {string} id - El ID del evento.
 * @param {boolean} includePayload - Si se debe incluir el payload.
 * @returns {Promise<object|null>} - El evento encontrado o null si no existe.
 */
export async function getEventById(id, includePayload = false) {
  const e = await eventStore.findById(id);
  if (!e) {
    return null;
  }
  return mapPublicItem(e, includePayload);
}