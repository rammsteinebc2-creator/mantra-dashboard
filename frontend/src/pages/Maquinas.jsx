import { useState, useEffect } from 'react';
import api from '../services/api';

const Maquinas = () => {
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', disponible: true });
  const [sending, setSending] = useState(false);

  const cargarMaquinas = async () => {
    try {
      const res = await api.get('/maquinas');
      setMaquinas(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio');
    setSending(true);
    try {
      await api.post('/maquinas', formData);
      setFormData({ nombre: '', descripcion: '', disponible: true });
      await cargarMaquinas();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-4">Cargando máquinas...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Máquinas / Herramientas</h1>

      {/* Formulario nueva máquina */}
      <div className="bg-white shadow-md rounded p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Máquina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="disponible" checked={formData.disponible} onChange={handleChange} className="mr-2" />
            <label className="text-sm font-medium">Disponible</label>
          </div>
          <button type="submit" disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {sending ? 'Guardando...' : 'Agregar Máquina'}
          </button>
        </form>
      </div>

      {/* Lista de máquinas */}
      <h2 className="text-xl font-semibold mb-4">Listado de Máquinas</h2>
      {maquinas.length === 0 ? (
        <p>No hay máquinas registradas.</p>
      ) : (
        <ul className="space-y-2">
          {maquinas.map(m => (
            <li key={m.id} className="border p-3 rounded shadow flex justify-between items-center">
              <div>
                <strong>{m.nombre}</strong>
                {m.descripcion && <span className="text-gray-600 text-sm ml-2">({m.descripcion})</span>}
                <span className={`ml-3 text-xs px-2 py-0.5 rounded ${m.disponible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {m.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Maquinas;