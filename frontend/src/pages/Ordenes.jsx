import { useState, useEffect } from 'react';
import api from '../services/api';

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [formData, setFormData] = useState({
    numeroOrden: '',
    clienteId: '',
    pieza: '',
    cantidad: 1,
    fechaEntrega: '',
    estado: 'Pendiente',
    maquinasAsignadas: [] // array de { maquinaId, horasUso }
  });
const usuario = JSON.parse(localStorage.getItem('usuario'));
const rol = usuario?.rol;
  const cargarOrdenes = async () => {
    try {
      const res = await api.get('/ordenes');
      setOrdenes(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarMaquinas = async () => {
    try {
      const res = await api.get('/maquinas');
      setMaquinas(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      await Promise.all([cargarOrdenes(), cargarClientes(), cargarMaquinas()]);
      setLoading(false);
    };
    cargarTodo();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const datosEnvio = {
  ...formData,
  clienteId: parseInt(formData.clienteId),
  cantidad: parseInt(formData.cantidad),
};
await api.post('/ordenes', datosEnvio);
      setMostrarForm(false);
      setFormData({ numeroOrden: '', clienteId: '', pieza: '', cantidad: 1, fechaEntrega: '', estado: 'Pendiente', maquinasAsignadas: [] });
      await cargarOrdenes();
    } catch (err) {
      alert('Error al crear orden: ' + err.response?.data?.error || err.message);
    }
  };

  if (loading) return <div className="p-4">Cargando órdenes...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
       {rol !== 'produccion' && (
  <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
    {mostrarForm ? 'Cancelar' : '+ Nueva Orden'}
  </button>
)}
{rol !== 'produccion' && mostrarForm && (
  <div className="bg-white shadow-md rounded p-4 mb-8">
    {/* formulario existente */}
  </div>
)}
      </div>

      {/* Formulario de nueva orden */}
      {mostrarForm && (
        <div className="bg-white shadow-md rounded p-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear Orden</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Número de Orden *</label>
                <input type="text" name="numeroOrden" value={formData.numeroOrden} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Cliente *</label>
                <select name="clienteId" value={formData.clienteId} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.empresa?.nombre ? `(${c.empresa.nombre})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Pieza *</label>
                <input type="text" name="pieza" value={formData.pieza} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Cantidad *</label>
                <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} className="w-full border rounded px-3 py-2" min="1" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Fecha de Entrega</label>
                <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asignar Máquinas (opcional)</label>
              <div className="space-y-2">
                {maquinas.map(m => (
                  <div key={m.id} className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id={`maq-${m.id}`}
                      checked={formData.maquinasAsignadas.some(a => a.maquinaId === m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            maquinasAsignadas: [...formData.maquinasAsignadas, { maquinaId: m.id, horasUso: null }]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            maquinasAsignadas: formData.maquinasAsignadas.filter(a => a.maquinaId !== m.id)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`maq-${m.id}`} className="flex-1">{m.nombre}</label>
                    {formData.maquinasAsignadas.some(a => a.maquinaId === m.id) && (
                      <input
                        type="number"
                        placeholder="Horas uso"
                        className="border rounded px-2 py-1 w-28"
                        value={formData.maquinasAsignadas.find(a => a.maquinaId === m.id)?.horasUso || ''}
                        onChange={(e) => {
                          const nuevas = formData.maquinasAsignadas.map(a =>
                            a.maquinaId === m.id ? { ...a, horasUso: parseFloat(e.target.value) || null } : a
                          );
                          setFormData({ ...formData, maquinasAsignadas: nuevas });
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Guardar Orden</button>
          </form>
        </div>
      )}

      {/* Listado de órdenes */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">N° Orden</th>
              <th className="border px-4 py-2">Cliente</th>
              <th className="border px-4 py-2">Pieza</th>
              <th className="border px-4 py-2">Cant.</th>
              <th className="border px-4 py-2">Estado</th>
              <th className="border px-4 py-2">F. Entrega</th>
              <th className="border px-4 py-2">Máquinas</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4">No hay órdenes registradas.</td></tr>
            ) : (
              ordenes.map(orden => (
                <tr key={orden.id}>
                  <td className="border px-4 py-2">{orden.numeroOrden}</td>
                  <td className="border px-4 py-2">{orden.cliente?.nombre} {orden.cliente?.empresa?.nombre ? `(${orden.cliente.empresa.nombre})` : ''}</td>
                  <td className="border px-4 py-2">{orden.pieza}</td>
                  <td className="border px-4 py-2">{orden.cantidad}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      orden.estado === 'Completada' ? 'bg-green-200 text-green-800' :
                      orden.estado === 'En Proceso' ? 'bg-yellow-200 text-yellow-800' :
                      orden.estado === 'Cancelada' ? 'bg-red-200 text-red-800' : 'bg-gray-200'
                    }`}>{orden.estado}</span>
                  </td>
                  <td className="border px-4 py-2">{orden.fechaEntrega ? new Date(orden.fechaEntrega).toLocaleDateString() : '-'}</td>
                  <td className="border px-4 py-2">
                    {orden.maquinas?.map(m => m.maquina.nombre).join(', ') || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ordenes;