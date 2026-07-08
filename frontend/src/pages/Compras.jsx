import { useState, useEffect } from 'react';
import { getCompras, crearCompra, editarCompra, actualizarDirectriz, eliminarCompra, getUsuariosSimple } from '../services/api';
import api from '../services/api';

  const Compras = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    solicitante: '',
    proyecto: '',
    material: '',
    dibujo: '',
    ancho: '',
    largo: '',
    grosor: '',
    diametro: '',
    fechaRequerida: '',
    descripcion: '',
    numeroPiezas: 1,
    proveedor1: '',
    proveedor2: '',
    proveedor3: '',
    proveedorElegido: '',
    dimensionesCotizadas: '',
    propuestaAlternativa: '',
    tiempoEntrega: '',
    fechaCompra: ''
  });
  const [sending, setSending] = useState(false);
  const [directrizEditando, setDirectrizEditando] = useState(null);
  const [nuevaDirectriz, setNuevaDirectriz] = useState('');
  const [proveedorElegidoEditando, setProveedorElegidoEditando] = useState(null);
  const [modoModal, setModoModal] = useState('creacion');
  const [editandoDimCotiz, setEditandoDimCotiz] = useState(null);     // id de la solicitud o null
const [editandoPropuesta, setEditandoPropuesta] = useState(null);
const [editandoTiempo, setEditandoTiempo] = useState(null);
const [editandoFechaCompra, setEditandoFechaCompra] = useState(null);
const handleProveedorElegidoChange = async (id, value) => {
  try {
    await editarCompra(id, { proveedorElegido: value });
    await cargarSolicitudes();
    setProveedorElegidoEditando(null);
  } catch (err) {
    alert('Error al actualizar proveedor elegido: ' + (err.response?.data?.error || err.message));
  }
};
const guardarDimCotiz = async (id, value) => {
  try {
    await editarCompra(id, { dimensionesCotizadas: value });
    await cargarSolicitudes();
    setEditandoDimCotiz(null);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error || err.message));
  }
};

const guardarPropuesta = async (id, value) => {
  try {
    await editarCompra(id, { propuestaAlternativa: value });
    await cargarSolicitudes();
    setEditandoPropuesta(null);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error || err.message));
  }
};

const guardarTiempo = async (id, value) => {
  try {
    await editarCompra(id, { tiempoEntrega: value });
    await cargarSolicitudes();
    setEditandoTiempo(null);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error || err.message));
  }
};

const guardarFechaCompra = async (id, value) => {
  // value viene en formato YYYY-MM-DD del date input
  try {
    await editarCompra(id, { fechaCompra: value || null });
    await cargarSolicitudes();
    setEditandoFechaCompra(null);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error || err.message));
  }
};
  // Estados para modal de proveedor
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null); // 'proveedor1', 'proveedor2', 'proveedor3'
  const [proveedorForm, setProveedorForm] = useState({ nombre: '', precio: '', comentario: '' });
  const [currentSolicitudId, setCurrentSolicitudId] = useState(null); // ID de la solicitud que se está editando

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const rol = usuario?.rol;
  const esAdmin = rol === 'admin';

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuariosSimple();
      setUsuarios(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setUsuarios([]);
    }
  };

  const cargarSolicitudes = async () => {
    try {
      const data = await getCompras();
      setSolicitudes(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === 'ancho' || name === 'grosor') {
      if (value !== '') newFormData.diametro = '';
    }
    if (name === 'diametro') {
      if (value !== '') {
        newFormData.ancho = '';
        newFormData.grosor = '';
      }
    }
    setFormData(newFormData);
  };

  const resetForm = () => {
    setFormData({
      solicitante: '',
      proyecto: '',
      material: '',
      dibujo: '',
      ancho: '',
      largo: '',
      grosor: '',
      diametro: '',
      fechaRequerida: '',
      descripcion: '',
      numeroPiezas: 1,
      proveedor1: '',
      proveedor2: '',
      proveedor3: '',
      proveedorElegido: '',
      dimensionesCotizadas: '',
      propuestaAlternativa: '',
      tiempoEntrega: '',
      fechaCompra: ''
    });
    setEditandoId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.solicitante || !formData.proyecto || !formData.material || !formData.fechaRequerida || !formData.numeroPiezas) {
      alert('Faltan campos obligatorios');
      return;
    }
    setSending(true);
    try {
      if (editandoId) {
        await editarCompra(editandoId, formData);
      } else {
        await crearCompra(formData);
      }
      setMostrarForm(false);
      resetForm();
      await cargarSolicitudes();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const abrirFormEditar = (solicitud) => {
    setEditandoId(solicitud.id);
    setModoModal('edicion');
    setFormData({
      solicitante: solicitud.solicitante || '',
      proyecto: solicitud.proyecto || '',
      material: solicitud.material || '',
      dibujo: solicitud.dibujo || '',
      ancho: solicitud.ancho || '',
      largo: solicitud.largo || '',
      grosor: solicitud.grosor || '',
      diametro: solicitud.diametro || '',
      fechaRequerida: solicitud.fechaRequerida ? solicitud.fechaRequerida.split('T')[0] : '',
      descripcion: solicitud.descripcion || '',
      numeroPiezas: solicitud.numeroPiezas || 1,
      proveedor1: solicitud.proveedor1 || '',
      proveedor2: solicitud.proveedor2 || '',
      proveedor3: solicitud.proveedor3 || '',
      proveedorElegido: solicitud.proveedorElegido || '',
      dimensionesCotizadas: solicitud.dimensionesCotizadas || '',
      propuestaAlternativa: solicitud.propuestaAlternativa || '',
      tiempoEntrega: solicitud.tiempoEntrega || '',
      fechaCompra: solicitud.fechaCompra ? solicitud.fechaCompra.split('T')[0] : ''
    });
    setMostrarForm(true);
  };

  const handleDirectrizChange = async (id, directriz) => {
    try {
      await actualizarDirectriz(id, directriz);
      await cargarSolicitudes();
      setDirectrizEditando(null);
    } catch (err) {
      alert('Error al cambiar directriz: ' + (err.response?.data?.error || err.message));
    }
  };

  // Funciones para proveedores
  const parseProveedor = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (e) {
      return { nombre: value, precio: '', comentario: '' };
    }
  };

  const formatearProveedor = (value) => {
    const data = parseProveedor(value);
    if (!data) return null;
    let texto = data.nombre;
    if (data.precio) texto += ` - $${data.precio}`;
    if (data.comentario) texto += ` (${data.comentario})`;
    return texto;
  };

  // Abrir modal de proveedor, guardando el ID de la solicitud
  const abrirModalProveedor = (solicitudId, campo, valorActual) => {
    setCurrentSolicitudId(solicitudId);
    setProveedorSeleccionado(campo);
    const datos = parseProveedor(valorActual);
    setProveedorForm({
      nombre: datos?.nombre || '',
      precio: datos?.precio || '',
      comentario: datos?.comentario || ''
    });
    setShowProveedorModal(true);
  };

  // Guardar proveedor automáticamente en la base de datos
  const guardarProveedor = async () => {
    const { nombre, precio, comentario } = proveedorForm;
    if (!nombre.trim()) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }
    const nuevoValor = JSON.stringify({ nombre, precio, comentario });
    try {
      // Actualizar solo el campo del proveedor en la solicitud correspondiente
      await editarCompra(currentSolicitudId, { [proveedorSeleccionado]: nuevoValor });
      // Refrescar la lista de solicitudes
      await cargarSolicitudes();
      setShowProveedorModal(false);
    } catch (err) {
      alert('Error al guardar proveedor: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (loading) return <div className="p-4">Cargando solicitudes...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Solicitudes de Compra</h1>
        {(rol === 'admin' || rol === 'compras' || rol === 'supervisor') && (
          <button
            onClick={() => {
              resetForm();
              setModoModal('creacion');
              setMostrarForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nueva Solicitud
          </button>
        )}
      </div>

      {/* Tabla de solicitudes */}
      <table className="min-w-[1400px] bg-white border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1">Solicitante</th>
            <th className="border px-2 py-1">Proyecto</th>
            <th className="border px-2 py-1">Material</th>
            <th className="border px-2 py-1"># Dibujo</th>
            <th className="border px-2 py-1">Dimensiones (plg)</th>
            <th className="border px-2 py-1">Fecha Req.</th>
            <th className="border px-2 py-1">Descripción</th>
            <th className="border px-2 py-1">No. Piezas</th>
            <th className="border px-2 py-1">Directriz</th>
            <th className="border px-2 py-1">Proveedor 1</th>
            <th className="border px-2 py-1">Proveedor 2</th>
            <th className="border px-2 py-1">Proveedor 3</th>
            <th className="border px-2 py-1">Prov. Elegido</th>
            <th className="border px-2 py-1">Dim. Cotizadas</th>
            <th className="border px-2 py-1">Propuesta Alt.</th>
            <th className="border px-2 py-1">Tiempo Entrega</th>
            <th className="border px-2 py-1">Fecha Compra</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
  {solicitudes.length === 0 ? (
    <tr>
      <td colSpan="18" className="text-center py-4">No hay solicitudes</td>
    </tr>
  ) : (
    solicitudes.map(s => {
      let dimensionesStr = '';
      if (s.diametro && s.diametro !== '') {
        let base = `⌀ ${s.diametro} (redondo)`;
        if (s.largo) base += ` - Largo: ${s.largo}`;
        dimensionesStr = base;
      } else {
        const parts = [];
        if (s.ancho) parts.push(`Ancho: ${s.ancho}`);
        if (s.largo) parts.push(`Largo: ${s.largo}`);
        if (s.grosor) parts.push(`Grosor: ${s.grosor}`);
        dimensionesStr = parts.join(' x ') || '-';
      }
      return (
        <tr key={s.id}>
          <td className="border px-2 py-1">{s.solicitante}</td>
          <td className="border px-2 py-1">{s.proyecto}</td>
          <td className="border px-2 py-1">{s.material}</td>
          <td className="border px-2 py-1">{s.dibujo || '-'}</td>
          <td className="border px-2 py-1">{dimensionesStr}</td>
          <td className="border px-2 py-1">{formatFecha(s.fechaRequerida)}</td>
          <td className="border px-2 py-1">{s.descripcion || '-'}</td>
          <td className="border px-2 py-1">{s.numeroPiezas}</td>
          <td className="border px-2 py-1">
            {esAdmin ? (
              directrizEditando === s.id ? (
                <select
                  value={nuevaDirectriz}
                  onChange={(e) => setNuevaDirectriz(e.target.value)}
                  onBlur={() => handleDirectrizChange(s.id, nuevaDirectriz)}
                  autoFocus
                  className="border rounded px-1 py-0 text-sm uppercase"
                >
                  <option value="comprar">COMPRAR</option>
                  <option value="cancelar">CANCELAR</option>
                  <option value="esperar">ESPERAR</option>
                </select>
              ) : (
                <span
  className={`cursor-pointer hover:shadow-md transition-all inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
    s.directriz === 'comprar' ? 'bg-green-200 text-green-800 border border-green-300' :
    s.directriz === 'cancelar' ? 'bg-red-200 text-red-800 border border-red-300' :
    s.directriz === 'esperar' ? 'bg-yellow-200 text-yellow-800 border border-yellow-300' :
    'bg-gray-200 text-gray-800 border border-gray-300'
  }`}
  onClick={() => { setDirectrizEditando(s.id); setNuevaDirectriz(s.directriz); }}
>
  {s.directriz}
</span>
              )
            ) : (
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  s.directriz === 'comprar' ? 'bg-green-200 text-green-800' :
                  s.directriz === 'cancelar' ? 'bg-red-200 text-red-800' :
                  s.directriz === 'esperar' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}
              >
                {s.directriz}
              </span>
            )}
          </td>

          {/* Proveedor 1 */}
          <td className="border px-2 py-1 align-top">
            {!s.proveedor1 ? (
              <button
                onClick={() => abrirModalProveedor(s.id, 'proveedor1', s.proveedor1)}
                className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
              >
                Agregar
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="whitespace-normal break-words">
                  {(() => {
                    const data = parseProveedor(s.proveedor1);
                    if (!data) return s.proveedor1;
                    let txt = data.nombre;
                    if (data.precio) txt += ` - $${data.precio}`;
                    if (data.comentario) txt += `\n(${data.comentario})`;
                    return txt.split('\n').map((line, i) => <div key={i}>{line}</div>);
                  })()}
                </div>
                <button
                  onClick={() => abrirModalProveedor(s.id, 'proveedor1', s.proveedor1)}
                  className="text-yellow-600 hover:underline text-left text-xs"
                >
                  Editar
                </button>
              </div>
            )}
          </td>

          {/* Proveedor 2 */}
          <td className="border px-2 py-1 align-top">
            {!s.proveedor2 ? (
              <button
                onClick={() => abrirModalProveedor(s.id, 'proveedor2', s.proveedor2)}
                className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
              >
                Agregar
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="whitespace-normal break-words">
                  {(() => {
                    const data = parseProveedor(s.proveedor2);
                    if (!data) return s.proveedor2;
                    let txt = data.nombre;
                    if (data.precio) txt += ` - $${data.precio}`;
                    if (data.comentario) txt += `\n(${data.comentario})`;
                    return txt.split('\n').map((line, i) => <div key={i}>{line}</div>);
                  })()}
                </div>
                <button
                  onClick={() => abrirModalProveedor(s.id, 'proveedor2', s.proveedor2)}
                  className="text-yellow-600 hover:underline text-left text-xs"
                >
                  Editar
                </button>
              </div>
            )}
          </td>

          {/* Proveedor 3 */}
          <td className="border px-2 py-1 align-top">
            {!s.proveedor3 ? (
              <button
                onClick={() => abrirModalProveedor(s.id, 'proveedor3', s.proveedor3)}
                className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
              >
                Agregar
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="whitespace-normal break-words">
                  {(() => {
                    const data = parseProveedor(s.proveedor3);
                    if (!data) return s.proveedor3;
                    let txt = data.nombre;
                    if (data.precio) txt += ` - $${data.precio}`;
                    if (data.comentario) txt += `\n(${data.comentario})`;
                    return txt.split('\n').map((line, i) => <div key={i}>{line}</div>);
                  })()}
                </div>
                <button
                  onClick={() => abrirModalProveedor(s.id, 'proveedor3', s.proveedor3)}
                  className="text-yellow-600 hover:underline text-left text-xs"
                >
                  Editar
                </button>
              </div>
            )}
          </td>

          <td className="border px-2 py-1">
  {(() => {
    // Obtener nombres de proveedores desde las columnas proveedor1,2,3
    const getSupplierName = (proveedorField) => {
      if (!proveedorField) return null;
      try {
        const parsed = JSON.parse(proveedorField);
        return parsed.nombre || null;
      } catch (e) {
        return proveedorField; // si es texto plano
      }
    };
    
    const supplierNames = [
      getSupplierName(s.proveedor1),
      getSupplierName(s.proveedor2),
      getSupplierName(s.proveedor3)
    ].filter(name => name !== null);
    
    const currentSelected = s.proveedorElegido || '';

    // Permitir edición solo para roles que pueden editar la solicitud (admin, compras, supervisor)
    const puedeEditar = rol === 'admin' || rol === 'compras' || rol === 'supervisor';
    
    if (!puedeEditar) {
      return <span>{currentSelected || '-'}</span>;
    }
    
    if (proveedorElegidoEditando === s.id) {
      return (
        <select
          value={currentSelected}
          onChange={(e) => handleProveedorElegidoChange(s.id, e.target.value)}
          onBlur={() => setProveedorElegidoEditando(null)}
          autoFocus
          className="border rounded px-1 py-0 text-sm"
        >
          <option value="">-- Ninguno --</option>
          {supplierNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      );
    } else {
      return (
        <span
  className="cursor-pointer inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 py-0.5 text-sm transition-colors"
  onClick={() => setProveedorElegidoEditando(s.id)}
>
  {currentSelected || '-'}
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
</span>
      );
    }
  })()}
</td>
          <td className="border px-2 py-1">
  {editandoDimCotiz === s.id ? (
    <input
      type="text"
      defaultValue={s.dimensionesCotizadas || ''}
      onBlur={(e) => guardarDimCotiz(s.id, e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && guardarDimCotiz(s.id, e.target.value)}
      autoFocus
      className="border rounded px-1 py-0 text-sm w-full"
    />
  ) : s.dimensionesCotizadas ? (
    <div className="flex justify-between items-center gap-1">
      <span className="truncate">{s.dimensionesCotizadas}</span>
      <button
        onClick={() => setEditandoDimCotiz(s.id)}
        className="text-yellow-600 hover:underline text-xs"
      >
        Editar
      </button>
    </div>
  ) : (
    <button
      onClick={() => setEditandoDimCotiz(s.id)}
      className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
    >
      Agregar
    </button>
  )}
</td>
          <td className="border px-2 py-1">
  {editandoPropuesta === s.id ? (
    <input
      type="text"
      defaultValue={s.propuestaAlternativa || ''}
      onBlur={(e) => guardarPropuesta(s.id, e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && guardarPropuesta(s.id, e.target.value)}
      autoFocus
      className="border rounded px-1 py-0 text-sm w-full"
    />
  ) : s.propuestaAlternativa ? (
    <div className="flex justify-between items-center gap-1">
      <span className="truncate">{s.propuestaAlternativa}</span>
      <button onClick={() => setEditandoPropuesta(s.id)} className="text-yellow-600 hover:underline text-xs">Editar</button>
    </div>
  ) : (
    <button onClick={() => setEditandoPropuesta(s.id)} className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs">Agregar</button>
  )}
</td>
          <td className="border px-2 py-1">
  {editandoTiempo === s.id ? (
    <input
      type="text"
      defaultValue={s.tiempoEntrega || ''}
      onBlur={(e) => guardarTiempo(s.id, e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && guardarTiempo(s.id, e.target.value)}
      autoFocus
      className="border rounded px-1 py-0 text-sm w-full"
    />
  ) : s.tiempoEntrega ? (
    <div className="flex justify-between items-center gap-1">
      <span className="truncate">{s.tiempoEntrega}</span>
      <button
        onClick={() => setEditandoTiempo(s.id)}
        className="text-yellow-600 hover:underline text-xs"
      >
        Editar
      </button>
    </div>
  ) : (
    <button
      onClick={() => setEditandoTiempo(s.id)}
      className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
    >
      Agregar
    </button>
  )}
</td>
          <td className="border px-2 py-1">
  {editandoFechaCompra === s.id ? (
    <input
      type="date"
      defaultValue={s.fechaCompra ? s.fechaCompra.split('T')[0] : ''}
      onBlur={(e) => guardarFechaCompra(s.id, e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && guardarFechaCompra(s.id, e.target.value)}
      autoFocus
      className="border rounded px-1 py-0 text-sm"
    />
  ) : s.fechaCompra ? (
    <div className="flex justify-between items-center gap-1">
      <span>{formatFecha(s.fechaCompra)}</span>
      <button onClick={() => setEditandoFechaCompra(s.id)} className="text-yellow-600 hover:underline text-xs">Editar</button>
    </div>
  ) : (
    <button onClick={() => setEditandoFechaCompra(s.id)} className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs">Agregar</button>
  )}
</td>
          <td className="border px-2 py-1">
            {(rol === 'admin' || rol === 'compras' || rol === 'supervisor') && (
              <button
                onClick={() => abrirFormEditar(s)}
                className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-700"
              >
                Editar Solicitud
              </button>
            )}
          </td>
        </tr>
      );
    })
  )}
</tbody>
      </table>

      {/* Modal de formulario de solicitud (crear/editar) - sin cambios */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h3 className="text-xl font-semibold mb-4">{modoModal === 'creacion' ? 'Nueva Solicitud' : 'Editar Solicitud'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Solicitante *</label>
                  <select
                    name="solicitante"
                    value={formData.solicitante}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-1"
                    required
                  >
                    <option value="">Seleccione un solicitante</option>
                    {Array.isArray(usuarios) && usuarios.map(u => (
                      <option key={u.id} value={u.nombre || u.email}>{u.nombre || u.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Proyecto *</label>
                  <input type="text" name="proyecto" value={formData.proyecto} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Material *</label>
                  <input type="text" name="material" value={formData.material} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium"># Dibujo</label>
                  <input type="text" name="dibujo" value={formData.dibujo} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                </div>
                {/* Dimensiones */}
                <div>
                  <label className="block text-sm font-medium">Ancho (plg)</label>
                  <input type="number" step="any" name="ancho" value={formData.ancho} onChange={handleChange} className="w-full border rounded px-2 py-1" disabled={formData.diametro !== ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Largo (plg)</label>
                  <input type="number" step="any" name="largo" value={formData.largo} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Grosor (plg)</label>
                  <input type="number" step="any" name="grosor" value={formData.grosor} onChange={handleChange} className="w-full border rounded px-2 py-1" disabled={formData.diametro !== ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Diámetro (plg) {formData.diametro !== '' && <span className="text-xs text-gray-500">(redondo)</span>}</label>
                  <input type="number" step="any" name="diametro" value={formData.diametro} onChange={handleChange} className="w-full border rounded px-2 py-1" disabled={formData.ancho !== '' || formData.grosor !== ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Fecha Requerida *</label>
                  <input type="date" name="fechaRequerida" value={formData.fechaRequerida} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">No. Piezas *</label>
                  <input type="number" name="numeroPiezas" value={formData.numeroPiezas} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Descripción</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2" className="w-full border rounded px-2 py-1"></textarea>
                </div>

                {/* Campos adicionales que solo se muestran en modo edición */}
                {modoModal === 'edicion' && (
                  <>
                    <div><label className="block text-sm font-medium">Proveedor 1</label><input type="text" name="proveedor1" value={formData.proveedor1} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Proveedor 2</label><input type="text" name="proveedor2" value={formData.proveedor2} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Proveedor 3</label><input type="text" name="proveedor3" value={formData.proveedor3} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Proveedor Elegido</label><input type="text" name="proveedorElegido" value={formData.proveedorElegido} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Dimensiones Cotizadas</label><input type="text" name="dimensionesCotizadas" value={formData.dimensionesCotizadas} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Propuesta Alternativa</label><input type="text" name="propuestaAlternativa" value={formData.propuestaAlternativa} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Tiempo Entrega</label><input type="text" name="tiempoEntrega" value={formData.tiempoEntrega} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                    <div><label className="block text-sm font-medium">Fecha Compra</label><input type="date" name="fechaCompra" value={formData.fechaCompra} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setMostrarForm(false); resetForm(); }} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
                <button type="submit" disabled={sending} className="bg-blue-600 text-white px-3 py-1 rounded">{sending ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar proveedor (ahora guarda automáticamente) */}
      {showProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {proveedorForm.nombre ? 'Editar Proveedor' : 'Agregar Proveedor'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Nombre *</label>
                <input
                  type="text"
                  value={proveedorForm.nombre}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={proveedorForm.precio}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, precio: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Comentario</label>
                <textarea
                  value={proveedorForm.comentario}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, comentario: e.target.value })}
                  rows="2"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowProveedorModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
              <button onClick={guardarProveedor} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;