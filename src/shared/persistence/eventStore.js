import fs from 'fs';
import path from 'path';

class FileEventStore {
  constructor(filePath = path.join(process.cwd(), '.data', 'events.json')) {
    this.filePath = filePath;
    this.events = this._load();
  }

  _load() {
    try {
      // ✅ CORRECCIÓN 2: Reemplazar la función inexistente 'readJson' por la implementación correcta.
      // Se utiliza fs.readFileSync para leer el contenido del archivo de forma síncrona
      // y JSON.parse para convertir el string a un objeto JavaScript.
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      // Si el archivo no existe o hay un error de parseo, se inicia con un array vacío.
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  _save() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.events, null, 2));
  }

  add(event) {
    this.events.push(event);
    this._save();
    return event;
  }

  findById(id) {
    return this.events.find(event => event.id === id);
  }

  search(criteria) {
    // La lógica de carga ya está en el constructor, así que this.events está disponible.
    let results = [...this.events];

    if (criteria.type) {
      results = results.filter(event => event.type === criteria.type);
    }
    if (criteria.user) {
      results = results.filter(event => event.user === criteria.user);
    }
    if (criteria.repo) {
      results = results.filter(event => event.repo === criteria.repo);
    }
    
    // Ordenar por fecha, del más reciente al más antiguo.
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return results;
  }
}

// Se exporta como un singleton para mantener una única instancia en toda la aplicación.
export default new FileEventStore();
