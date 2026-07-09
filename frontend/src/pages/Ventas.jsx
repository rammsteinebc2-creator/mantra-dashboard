import { useState, useEffect } from 'react';
import { getClientes, getVentas, crearVenta, editarVenta, cancelarVenta, getEmpresas } from '../services/api';
import { subirPdfVenta, eliminarPdfVenta } from '../services/api';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [filtroTabla, setFiltroTabla] = useState('todas');
  const [formData, setFormData] = useState({
    numeroOrden: '',
    clienteId: '',
    cantidadPiezas: 1,
    moneda: 'MXN',
    montoTotal: '',
    iva: 0,
    totalConIva: 0,
    fechaEntrega: '',
    facturacion: 'No facturado',
    pago: 'Pendiente'
  });
  const [empresas, setEmpresas] = useState([]);
const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [sending, setSending] = useState(false);

  // Estados para edición
  const [editandoId, setEditandoId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelandoId, setCancelandoId] = useState(null);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const calcularIvaYTotal = (monto, moneda) => {
    const montoNum = parseFloat(monto) || 0;
    let iva = 0;
    if (moneda === 'MXN') iva = montoNum * 0.16;
    const total = montoNum + iva;
    return { iva, total };
  };

  // Actualizar formulario de creación cuando cambie montoTotal o moneda
  useEffect(() => {
    const { iva, total } = calcularIvaYTotal(formData.montoTotal, formData.moneda);
    setFormData(prev => ({ ...prev, iva, totalConIva: total }));
  }, [formData.montoTotal, formData.moneda]);

  // Actualizar formulario de edición cuando cambien sus campos
  useEffect(() => {
    if (editFormData) {
      const { iva, total } = calcularIvaYTotal(editFormData.montoTotal, editFormData.moneda);
      setEditFormData(prev => ({ ...prev, iva, totalConIva: total }));
    }
  }, [editFormData?.montoTotal, editFormData?.moneda]);

  const cargarVentas = async () => {
    try {
      const data = await getVentas();
      setVentas(data);
      const uniqueYears = [...new Set(data.map(v => new Date(v.fechaCreacion).getFullYear()))].sort((a,b) => b - a);
      setYears(uniqueYears.length ? uniqueYears : [new Date().getFullYear()]);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      console.error(err);
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
  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      await Promise.all([cargarVentas(), cargarClientes(), cargarEmpresas()]);
      setLoading(false);
    };
    cargarTodo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.numeroOrden || !formData.clienteId || !formData.cantidadPiezas || !formData.montoTotal || !formData.fechaEntrega) {
      alert('Faltan campos obligatorios (incluye fecha de entrega)');
      return;
    }
    setSending(true);
    try {
      await crearVenta({
        ...formData,
        clienteId: parseInt(formData.clienteId),
        cantidadPiezas: parseInt(formData.cantidadPiezas),
        montoTotal: parseFloat(formData.montoTotal),
        fechaEntrega: formData.fechaEntrega,
      });
      setMostrarForm(false);
      setFormData({
        numeroOrden: '',
        clienteId: '',
        cantidadPiezas: 1,
        moneda: 'MXN',
        montoTotal: '',
        iva: 0,
        totalConIva: 0,
        fechaEntrega: '',
        facturacion: 'No facturado',
        pago: 'Pendiente'
      });
      await cargarVentas();
    } catch (err) {
      alert('Error al crear venta: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  // Funciones de edición
  const abrirEdicion = (venta) => {
    setEditandoId(venta.id);
    setEditFormData({
      numeroOrden: venta.numeroOrden,
      clienteId: venta.clienteId,
      cantidadPiezas: venta.cantidadPiezas,
      moneda: venta.moneda,
      montoTotal: venta.montoTotal,
      fechaEntrega: venta.fechaEntrega ? venta.fechaEntrega.split('T')[0] : '',
      iva: venta.iva,
      totalConIva: venta.totalConIva
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarEdicion = async () => {
    if (!editFormData.numeroOrden || !editFormData.clienteId || !editFormData.cantidadPiezas || !editFormData.montoTotal || !editFormData.fechaEntrega) {
      alert('Faltan campos obligatorios');
      return;
    }
    try {
      await editarVenta(editandoId, {
        numeroOrden: editFormData.numeroOrden,
        clienteId: parseInt(editFormData.clienteId),
        cantidadPiezas: parseInt(editFormData.cantidadPiezas),
        moneda: editFormData.moneda,
        montoTotal: parseFloat(editFormData.montoTotal),
        fechaEntrega: editFormData.fechaEntrega
      });
      setShowEditModal(false);
      setEditandoId(null);
      await cargarVentas();
    } catch (err) {
      alert('Error al editar: ' + (err.response?.data?.error || err.message));
    }
  };

  // Cancelar venta
  const confirmarCancelar = (id) => {
    setCancelandoId(id);
    setShowCancelModal(true);
  };

  const ejecutarCancelar = async () => {
    try {
      await cancelarVenta(cancelandoId);
      setShowCancelModal(false);
      setCancelandoId(null);
      await cargarVentas();
    } catch (err) {
      alert('Error al cancelar: ' + (err.response?.data?.error || err.message));
    }
  };

  // Funciones para manejar PDF
const handleSubirPdf = async (id, file) => {
  if (!file) return;
  try {
    await subirPdfVenta(id, file);
    await cargarVentas();
  } catch (err) {
    alert('Error al subir PDF: ' + (err.response?.data?.error || err.message));
  }
};

const handleEliminarPdf = async (id) => {
  if (!window.confirm('¿Eliminar el PDF asociado a esta venta?')) return;
  try {
    await eliminarPdfVenta(id);
    await cargarVentas();
  } catch (err) {
    alert('Error al eliminar PDF: ' + (err.response?.data?.error || err.message));
  }
};

  const getFacturacionClass = (estado) => {
    if (estado === 'Cancelada') return 'bg-gray-400 text-white';
    switch (estado) {
      case 'No facturado': return 'bg-red-200 text-red-800 font-semibold px-2 py-1 rounded text-center';
      case 'Facturado parcialmente': return 'bg-yellow-200 text-yellow-800 font-semibold px-2 py-1 rounded text-center';
      case 'Facturado': return 'bg-green-200 text-green-800 font-semibold px-2 py-1 rounded text-center';
      default: return 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-center';
    }
  };

  const getPagoClass = (estado) => {
    if (estado === 'Cancelado') return 'bg-gray-400 text-white';
    switch (estado) {
      case 'Pendiente': return 'bg-red-200 text-red-800 font-semibold px-2 py-1 rounded text-center';
      case 'Parcial': return 'bg-yellow-200 text-yellow-800 font-semibold px-2 py-1 rounded text-center';
      case 'Pagado': return 'bg-green-200 text-green-800 font-semibold px-2 py-1 rounded text-center';
      default: return 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-center';
    }
  };

  const isFechaEntregaVencida = (fechaEntrega, facturacion, estado) => {
    if (estado === 'Cancelada') return false;
    if (facturacion === 'Facturado') return false;
    if (!fechaEntrega) return false;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const entrega = new Date(fechaEntrega);
    entrega.setHours(0,0,0,0);
    return entrega < hoy;
  };

  // Filtrar ventas por año y por estado de tabla
  const ventasFiltradas = ventas.filter(v => {
    if (empresaFiltro && v.cliente?.empresaId !== parseInt(empresaFiltro)) return false;
    if (new Date(v.fechaCreacion).getFullYear() !== selectedYear) return false;
    if (filtroTabla === 'vencidas') {
      const entregaVencida = isFechaEntregaVencida(v.fechaEntrega, v.facturacion, v.estado);
      return entregaVencida;
    }
    if (filtroTabla === 'pendiente_pago') {
      return v.pago === 'Pendiente' && v.estado !== 'Cancelada';
    }
    return true;
  }).filter(v => v.estado !== 'Cancelada' || filtroTabla === 'todas'); // opcional: mostrar canceladas solo si filtro es 'todas'

  const totalMonto = ventasFiltradas.reduce((sum, v) => sum + v.montoTotal, 0);
  const totalIVA = ventasFiltradas.reduce((sum, v) => sum + v.iva, 0);
  const totalConIVA = ventasFiltradas.reduce((sum, v) => sum + v.totalConIva, 0);
  const totalPiezas = ventasFiltradas.reduce((sum, v) => sum + v.cantidadPiezas, 0);

  if (loading) return <div className="p-4">Cargando ventas...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Órdenes de Venta (Pedidos de Clientes)</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva Venta'}
        </button>
      </div>

      {/* Filtros y resumen */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="font-medium">Año:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border rounded px-3 py-1">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium">Mostrar:</label>
              <select value={filtroTabla} onChange={(e) => setFiltroTabla(e.target.value)} className="border rounded px-3 py-1">
                <option value="todas">Todas</option>
                <option value="vencidas">Vencidas</option>
                <option value="pendiente_pago">Pendiente de pago</option>
              </select>
              <select
  value={empresaFiltro}
  onChange={(e) => setEmpresaFiltro(e.target.value)}
  className="border rounded px-3 py-1"
>
  <option value="">Todas las empresas</option>
  {empresas.map(emp => (
    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
  ))}
</select>
            </div>
          </div>
          <div className="text-gray-500 text-sm">Mostrando {ventasFiltradas.length} ventas</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600 uppercase">Total Ventas</div>
            <div className="text-2xl font-bold">{formatCurrency(totalMonto)}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600 uppercase">Total IVA</div>
            <div className="text-2xl font-bold">{formatCurrency(totalIVA)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600 uppercase">Total con IVA</div>
            <div className="text-2xl font-bold">{formatCurrency(totalConIVA)}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-xs text-yellow-600 uppercase">Total Piezas</div>
            <div className="text-2xl font-bold">{totalPiezas}</div>
          </div>
        </div>
      </div>

      {/* Formulario nueva venta (colapsable) */}
      {mostrarForm && (
        <div className="bg-white shadow-md rounded p-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nueva Venta</h2>
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
                <label className="block text-sm font-medium">Cantidad de Piezas *</label>
                <input type="number" name="cantidadPiezas" value={formData.cantidadPiezas} onChange={handleChange} min="1" className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Moneda *</label>
                <select name="moneda" value={formData.moneda} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="MXN">MXN (16% IVA)</option>
                  <option value="USD">USD (0% IVA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Monto Total (sin IVA) *</label>
                <input type="number" step="0.01" name="montoTotal" value={formData.montoTotal} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">IVA</label>
                <input type="number" step="0.01" value={formData.iva.toFixed(2)} readOnly disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Total con IVA</label>
                <input type="number" step="0.01" value={formData.totalConIva.toFixed(2)} readOnly disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Fecha de Entrega *</label>
                <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
              </div>
            </div>
            <button type="submit" disabled={sending} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {sending ? 'Guardando...' : 'Guardar Venta'}
            </button>
          </form>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">N° Orden</th>
              <th className="border px-4 py-2">Cliente (Empresa)</th>
              <th className="border px-4 py-2">Piezas</th>
              <th className="border px-4 py-2">Moneda</th>
              <th className="border px-4 py-2">Monto</th>
              <th className="border px-4 py-2">IVA</th>
              <th className="border px-4 py-2">Total</th>
              <th className="border px-4 py-2">Facturación</th>
              <th className="border px-4 py-2">Pago</th>
              <th className="border px-4 py-2">Fecha Creación</th>
              <th className="border px-4 py-2">Fecha Entrega</th>
              <th className="border px-4 py-2">PDF</th>
              <th className="border px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
  {ventasFiltradas.length === 0 ? (
    <tr>
      <td colSpan="13" className="text-center py-4">No hay ventas para los filtros seleccionados.</td>
    </tr>
  ) : (
    ventasFiltradas.map(venta => {
      const entregaVencida = isFechaEntregaVencida(venta.fechaEntrega, venta.facturacion, venta.estado);
      const cancelada = venta.estado === 'Cancelada';
      return (
        <tr key={venta.id} className={cancelada ? 'bg-gray-100 line-through' : ''}>
          <td className="border px-4 py-2">{venta.numeroOrden}</td>
          <td className="border px-4 py-2">{venta.cliente?.nombre} {venta.cliente?.empresa?.nombre ? `(${venta.cliente.empresa.nombre})` : ''}</td>
          <td className="border px-4 py-2">{venta.cantidadPiezas}</td>
          <td className="border px-4 py-2">{venta.moneda}</td>
          <td className="border px-4 py-2">{formatCurrency(venta.montoTotal)}</td>
          <td className="border px-4 py-2">{formatCurrency(venta.iva)}</td>
          <td className="border px-4 py-2">{formatCurrency(venta.totalConIva)}</td>
          <td className="border px-4 py-2"><div className={getFacturacionClass(venta.facturacion)}>{venta.facturacion}</div></td>
          <td className="border px-4 py-2"><div className={getPagoClass(venta.pago)}>{venta.pago}</div></td>
          <td className="border px-4 py-2">{formatDate(venta.fechaCreacion)}</td>
          <td className={`border px-4 py-2 ${entregaVencida && !cancelada ? 'bg-red-100 font-semibold' : ''}`}>
  {formatDate(venta.fechaEntrega)}
</td>

{/* Celda PDF */}
<td className="border px-4 py-2 text-center">
  {!cancelada && (
    <>
      {venta.pdfUrl ? (
        <div className="flex items-center justify-center gap-2">
          <a
            href={venta.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
            title="Descargar PDF"
          >
            📄 Ver
          </a>
          <button
            onClick={() => handleEliminarPdf(venta.id)}
            className="text-red-600 hover:underline text-sm"
            title="Eliminar PDF"
          >
            ❌
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => document.getElementById(`pdf-upload-${venta.id}`).click()}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
          >
            Subir PDF
          </button>
          <input
            type="file"
            id={`pdf-upload-${venta.id}`}
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleSubirPdf(venta.id, e.target.files[0])}
          />
        </>
      )}
    </>
  )}
</td>

<td className="border px-4 py-2 text-center">
  {!cancelada && (
    <div className="flex justify-center gap-2">
      <button onClick={() => abrirEdicion(venta)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Editar</button>
      <button onClick={() => confirmarCancelar(venta.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">Cancelar</button>
    </div>
  )}
</td>
        </tr>
      );
    })
  )}
</tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Editar Venta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Número de Orden *</label>
                <input type="text" name="numeroOrden" value={editFormData.numeroOrden} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Cliente *</label>
                <select name="clienteId" value={editFormData.clienteId} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.empresa?.nombre ? `(${c.empresa.nombre})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Cantidad de Piezas *</label>
                <input type="number" name="cantidadPiezas" value={editFormData.cantidadPiezas} onChange={handleEditChange} min="1" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Moneda *</label>
                <select name="moneda" value={editFormData.moneda} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                  <option value="MXN">MXN (16% IVA)</option>
                  <option value="USD">USD (0% IVA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Monto Total (sin IVA) *</label>
                <input type="number" step="0.01" name="montoTotal" value={editFormData.montoTotal} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">IVA</label>
                <input type="number" step="0.01" value={editFormData.iva.toFixed(2)} readOnly disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Total con IVA</label>
                <input type="number" step="0.01" value={editFormData.totalConIva.toFixed(2)} readOnly disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Fecha de Entrega *</label>
                <input type="date" name="fechaEntrega" value={editFormData.fechaEntrega} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
              <button onClick={guardarEdicion} className="bg-green-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Cancelar Venta</h3>
            <p className="mb-4">¿Estás seguro de cancelar esta venta? Se cancelarán todas las facturas asociadas no pagadas.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">No</button>
              <button onClick={ejecutarCancelar} className="bg-red-600 text-white px-4 py-2 rounded">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;