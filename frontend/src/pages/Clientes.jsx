import { useState, useEffect } from 'react';
import { getClientes, crearCliente, getEmpresas, editarCliente, eliminarCliente } from '../services/api';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    empresaId: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [sending, setSending] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data.filter(c => c.activo !== false));
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      console.error('Error cargando empresas:', err);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([cargarClientes(), cargarEmpresas()]);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre del contacto es obligatorio');
      return;
    }
    if (!formData.empresaId) {
      alert('Debes seleccionar una empresa');
      return;
    }
    setSending(true);
    try {
      await crearCliente({
        nombre: formData.nombre,
        empresaId: parseInt(formData.empresaId),
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion
      });
      setFormData({ nombre: '', empresaId: '', telefono: '', email: '', direccion: '' });
      await cargarClientes();
    } catch (err) {
      alert('Error al crear cliente: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const abrirEdicion = (cliente) => {
    setEditandoId(cliente.id);
    setEditFormData({
      nombre: cliente.nombre,
      empresaId: cliente.empresaId,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const guardarEdicion = async () => {
    if (!editFormData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!editFormData.empresaId) {
      alert('Debes seleccionar una empresa');
      return;
    }
    try {
      await editarCliente(editandoId, {
        nombre: editFormData.nombre,
        empresaId: parseInt(editFormData.empresaId),
        telefono: editFormData.telefono,
        email: editFormData.email,
        direccion: editFormData.direccion
      });
      setShowEditModal(false);
      setEditandoId(null);
      await cargarClientes();
    } catch (err) {
      alert('Error al editar: ' + (err.response?.data?.error || err.message));
    }
  };

  const confirmarEliminar = (id) => {
    setEliminandoId(id);
    setShowDeleteModal(true);
  };

  const ejecutarEliminar = async () => {
    try {
      await eliminarCliente(eliminandoId);
      setShowDeleteModal(false);
      setEliminandoId(null);
      await cargarClientes();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="p-4">Cargando datos...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      <div className="bg-white shadow-md rounded p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Nuevo Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del contacto *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Empresa *</label>
              <select name="empresaId" value={formData.empresaId} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="">Seleccione una empresa</option>
                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
              </select>
              {empresas.length === 0 && <p className="text-sm text-red-500 mt-1">No hay empresas registradas. Ve a la página de Empresas para agregar una.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <button type="submit" disabled={sending || empresas.length === 0} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {sending ? 'Guardando...' : 'Agregar Cliente'}
          </button>
        </form>
      </div>

      <h2 className="text-xl font-semibold mb-4">Lista de Clientes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">Nombre</th>
              <th className="border px-4 py-2">Empresa</th>
              <th className="border px-4 py-2">Teléfono</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No hay clientes registrados.</td>
              </tr>
            ) : (
              clientes.map(cliente => {
                const empresa = empresas.find(e => e.id === cliente.empresaId);
                return (
                  <tr key={cliente.id}>
                    <td className="border px-4 py-2">{cliente.nombre}</td>
                    <td className="border px-4 py-2">{empresa ? empresa.nombre : '-'}</td>
                    <td className="border px-4 py-2">{cliente.telefono || '-'}</td>
                    <td className="border px-4 py-2">{cliente.email || '-'}</td>
                    <td className="border px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirEdicion(cliente)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Editar</button>
                        <button onClick={() => confirmarEliminar(cliente.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Editar Cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Nombre *</label>
                <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Empresa *</label>
                <select name="empresaId" value={editFormData.empresaId} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Teléfono</label>
                <input type="text" name="telefono" value={editFormData.telefono} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
              <button onClick={guardarEdicion} className="bg-green-600 text-white px-3 py-1 rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Eliminar Cliente</h3>
            <p className="mb-4">¿Estás seguro de eliminar este cliente? Se desactivará y no aparecerá en la lista.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">No</button>
              <button onClick={ejecutarEliminar} className="bg-red-600 text-white px-3 py-1 rounded">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;