import { useState, useEffect } from 'react';
import { getUsuarios, actualizarRolUsuario } from '../services/api';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoRol, setEditandoRol] = useState('');
  const [sending, setSending] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const iniciarEdicion = (usuario) => {
    setEditandoId(usuario.id);
    setEditandoRol(usuario.rol);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoRol('');
  };

  const guardarRol = async (id) => {
    if (!editandoRol) return;
    setSending(true);
    try {
      await actualizarRolUsuario(id, editandoRol);
      setEditandoId(null);
      await cargarUsuarios();
    } catch (err) {
      alert('Error al actualizar rol: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-4">Cargando usuarios...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const rolesDisponibles = ['admin', 'ventas', 'facturacion', 'almacen', 'compras', 'produccion', 'supervisor', 'usuario'];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Nombre</th>
              <th className="border px-4 py-2">Rol</th>
              <th className="border px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4">No hay usuarios registrados.</td></tr>
            ) : (
              usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="border px-4 py-2">{usuario.id}</td>
                  <td className="border px-4 py-2">{usuario.email}</td>
                  <td className="border px-4 py-2">{usuario.nombre || '-'}</td>
                  <td className="border px-4 py-2">
                    {editandoId === usuario.id ? (
                      <select
                        value={editandoRol}
                        onChange={(e) => setEditandoRol(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        {rolesDisponibles.map(rol => (
                          <option key={rol} value={rol}>{rol}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize">{usuario.rol}</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {editandoId === usuario.id ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => guardarRol(usuario.id)}
                          disabled={sending}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicion(usuario)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        Editar Rol
                      </button>
                    )}
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

export default Usuarios;