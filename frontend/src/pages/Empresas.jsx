import { useState, useEffect } from 'react';
import { getEmpresas, crearEmpresa, editarEmpresa, eliminarEmpresa } from '../services/api';

const Empresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', direccion: '', telefono: '', email: '' });
  const [sending, setSending] = useState(false);

  // Estados para edición
  const [editandoId, setEditandoId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      // Mostrar solo empresas activas
      setEmpresas(data.filter(e => e.activo !== false));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre de la empresa es obligatorio');
      return;
    }
    setSending(true);
    try {
      await crearEmpresa(formData);
      setFormData({ nombre: '', direccion: '', telefono: '', email: '' });
      await cargarEmpresas();
    } catch (err) {
      alert('Error al crear empresa: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  // Editar
  const abrirEdicion = (empresa) => {
    setEditandoId(empresa.id);
    setEditFormData({
      nombre: empresa.nombre,
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      email: empresa.email || ''
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
    try {
      await editarEmpresa(editandoId, editFormData);
      setShowEditModal(false);
      setEditandoId(null);
      await cargarEmpresas();
    } catch (err) {
      alert('Error al editar: ' + (err.response?.data?.error || err.message));
    }
  };

  // Eliminar (desactivar)
  const confirmarEliminar = (id) => {
    setEliminandoId(id);
    setShowDeleteModal(true);
  };

  const ejecutarEliminar = async () => {
    try {
      await eliminarEmpresa(eliminandoId);
      setShowDeleteModal(false);
      setEliminandoId(null);
      await cargarEmpresas();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="p-4">Cargando empresas...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Empresas</h1>

      {/* Formulario nueva empresa */}
      <div className="bg-white shadow-md rounded p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Nueva Empresa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full border rounded px-3 py-2" />
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
          <button type="submit" disabled={sending} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {sending ? 'Guardando...' : 'Agregar Empresa'}
          </button>
        </form>
      </div>

      {/* Tabla de empresas */}
      <h2 className="text-xl font-semibold mb-4">Lista de Empresas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">Nombre</th>
              <th className="border px-4 py-2">Dirección</th>
              <th className="border px-4 py-2">Teléfono</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No hay empresas registradas.</td>
              </tr>
            ) : (
              empresas.map(emp => (
                <tr key={emp.id}>
                  <td className="border px-4 py-2">{emp.nombre}</td>
                  <td className="border px-4 py-2">{emp.direccion || '-'}</td>
                  <td className="border px-4 py-2">{emp.telefono || '-'}</td>
                  <td className="border px-4 py-2">{emp.email || '-'}</td>
                  <td className="border px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => abrirEdicion(emp)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Editar</button>
                      <button onClick={() => confirmarEliminar(emp.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Editar Empresa</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Nombre *</label>
                <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Dirección</label>
                <input type="text" name="direccion" value={editFormData.direccion} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Eliminar Empresa</h3>
            <p className="mb-4">¿Estás seguro de eliminar esta empresa? Se desactivará y no aparecerá en la lista. Solo se permite si no tiene clientes activos.</p>
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

export default Empresas;