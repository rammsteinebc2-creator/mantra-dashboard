import { useState, useEffect } from 'react';
import api from '../services/api';

const Materiales = () => {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', stock: '', unidad: '', bajoStock: '' });
  const [sending, setSending] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoStock, setEditandoStock] = useState('');

  const cargarMateriales = async () => {
    try {
      const res = await api.get('/materiales');
      setMateriales(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.stock || !formData.unidad) {
      alert('Nombre, stock y unidad son obligatorios');
      return;
    }
    setSending(true);
    try {
      await api.post('/materiales', formData);
      setFormData({ nombre: '', stock: '', unidad: '', bajoStock: '' });
      await cargarMateriales();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const actualizarStock = async (id, nuevoStock) => {
    try {
      await api.patch(`/materiales/${id}/stock`, { stock: parseInt(nuevoStock) });
      await cargarMateriales();
      setEditandoId(null);
    } catch (err) {
      alert('Error al actualizar stock: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="p-4">Cargando inventario...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inventario de Materiales</h1>

      {/* Formulario nuevo material */}
      <div className="bg-white shadow-md rounded p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Material</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stock *</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad *</label>
              <input type="text" name="unidad" value={formData.unidad} onChange={handleChange} placeholder="kg, m, unidades..." className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock mínimo (alerta)</label>
            <input type="number" name="bajoStock" value={formData.bajoStock} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {sending ? 'Guardando...' : 'Agregar Material'}
          </button>
        </form>
      </div>

      {/* Lista de materiales */}
      <h2 className="text-xl font-semibold mb-4">Listado de Materiales</h2>
      {materiales.length === 0 ? (
        <p>No hay materiales registrados.</p>
      ) : (
        <ul className="space-y-2">
          {materiales.map(mat => {
            const bajoStockAlerta = mat.bajoStock && mat.stock <= mat.bajoStock;
            return (
              <li key={mat.id} className={`border p-3 rounded shadow ${bajoStockAlerta ? 'border-red-400 bg-red-50' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex-1">
                    <strong className="text-lg">{mat.nombre}</strong>
                    <span className="ml-2 text-gray-600">({mat.unidad})</span>
                    {bajoStockAlerta && (
                      <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">¡Bajo stock!</span>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      Stock actual: <span className="font-semibold">{mat.stock}</span>
                      {mat.bajoStock && ` | Mínimo: ${mat.bajoStock}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editandoId === mat.id ? (
                      <>
                        <input
                          type="number"
                          value={editandoStock}
                          onChange={(e) => setEditandoStock(e.target.value)}
                          className="border rounded px-2 py-1 w-24"
                          autoFocus
                        />
                        <button
                          onClick={() => actualizarStock(mat.id, editandoStock)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="bg-gray-400 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoId(mat.id);
                          setEditandoStock(mat.stock.toString());
                        }}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Editar Stock
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Materiales;