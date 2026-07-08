import { useState, useEffect } from 'react';
import { getVentas, getFacturas, crearFactura, cancelarFactura, registrarPago } from '../services/api';

const Facturaciones = () => {
  const [ventas, setVentas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [facturaForm, setFacturaForm] = useState({ numeroFactura: '', monto: '', fecha: '' });
  const [facturaSending, setFacturaSending] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [pagoForm, setPagoForm] = useState({ fecha: '', medio: 'Transferencia', seguimiento: '' });
  const [pagoSending, setPagoSending] = useState(false);
  const [cancelarMotivo, setCancelarMotivo] = useState('');
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [facturaCancelarId, setFacturaCancelarId] = useState(null);
  const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};

  const cargarDatos = async () => {
    try {
      const [ventasData, facturasData] = await Promise.all([getVentas(), getFacturas()]);
      setVentas(ventasData);
      setFacturas(facturasData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getMontoFacturado = (ventaId) => {
    const facturasVenta = facturas.filter(f => f.ventaId === ventaId && !f.cancelada);
    return facturasVenta.reduce((sum, f) => sum + f.monto, 0);
  };

  const getSaldoPendiente = (venta) => {
    const facturado = getMontoFacturado(venta.id);
    return venta.totalConIva - facturado;
  };

  const handleAbrirFacturaModal = (venta) => {
    setSelectedVenta(venta);
    setFacturaForm({ numeroFactura: '', monto: '', fecha: new Date().toISOString().slice(0,10) });
    setShowFacturaModal(true);
  };

  const handleCrearFactura = async (e) => {
    e.preventDefault();
    if (!facturaForm.numeroFactura || !facturaForm.monto) {
      alert('Número de factura y monto son obligatorios');
      return;
    }
    const montoNum = parseFloat(facturaForm.monto);
    const saldo = getSaldoPendiente(selectedVenta);
    if (montoNum > saldo) {
      alert(`El monto excede el saldo pendiente (${saldo.toFixed(2)}).`);
      return;
    }
    setFacturaSending(true);
    try {
      await crearFactura({
        ventaId: selectedVenta.id,
        numeroFactura: facturaForm.numeroFactura,
        monto: montoNum,
        fecha: facturaForm.fecha || undefined
      });
      setShowFacturaModal(false);
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setFacturaSending(false);
    }
  };

  const handleAbrirPagoModal = (factura) => {
    if (factura.pago) {
      alert('Esta factura ya tiene un pago registrado');
      return;
    }
    setSelectedFactura(factura);
    setPagoForm({ fecha: new Date().toISOString().slice(0,10), medio: 'Transferencia', seguimiento: '' });
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    if (!pagoForm.medio) {
      alert('Medio de pago es obligatorio');
      return;
    }
    if (!pagoForm.seguimiento) {
      alert('El número de seguimiento / referencia es obligatorio');
      return;
    }
    setPagoSending(true);
    try {
      await registrarPago({
        facturaId: selectedFactura.id,
        fecha: pagoForm.fecha || undefined,
        medio: pagoForm.medio,
        seguimiento: pagoForm.seguimiento
      });
      setShowPagoModal(false);
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setPagoSending(false);
    }
  };

  const handleAbrirCancelarModal = (facturaId) => {
    setFacturaCancelarId(facturaId);
    setCancelarMotivo('');
    setShowCancelarModal(true);
  };

  const handleCancelarFactura = async () => {
    if (!facturaCancelarId) return;
    try {
      await cancelarFactura(facturaCancelarId, cancelarMotivo);
      setShowCancelarModal(false);
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="p-4">Cargando facturaciones...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Facturación de Ventas</h1>

      {ventas.length === 0 ? (
        <p>No hay ventas registradas.</p>
      ) : (
        <div className="space-y-8">
          {ventas.map(venta => {
            const facturado = getMontoFacturado(venta.id);
            const saldo = getSaldoPendiente(venta);
            const facturasVenta = facturas.filter(f => f.ventaId === venta.id);
            return (
              <div key={venta.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Orden: {venta.numeroOrden}</h2>
                    <p className="text-gray-600">{venta.cliente?.nombre} ({venta.cliente?.empresa?.nombre})</p>
                    <p>Piezas: {venta.cantidadPiezas} | Monto Total: {formatCurrency(venta.totalConIva)} {venta.moneda}</p>
                    <p className={`text-sm font-medium ${saldo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      Facturado: {formatCurrency(facturado)} | Saldo pendiente: {formatCurrency(saldo)}
                    </p>
                  </div>
                  {saldo > 0 && (
                    <button
                      onClick={() => handleAbrirFacturaModal(venta)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      + Facturar
                    </button>
                  )}
                </div>

                {facturasVenta.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-2 py-1">Factura</th>
                          <th className="border px-2 py-1">Monto</th>
                          <th className="border px-2 py-1">Fecha</th>
                          <th className="border px-2 py-1">Estado</th>
                          <th className="border px-2 py-1">Pago</th>
                          <th className="border px-2 py-1">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facturasVenta.map(f => (
                          <tr key={f.id} className={f.cancelada ? 'bg-gray-200 line-through' : ''}>
                            <td className="border px-2 py-1">{f.numeroFactura}</td>
                            <td className="border px-2 py-1">{formatCurrency(f.monto)}</td>
                            <td className="border px-2 py-1">{new Date(f.fecha).toLocaleDateString()}</td>
                            <td className="border px-2 py-1">{f.cancelada ? 'Cancelada' : 'Activa'}</td>
                            <td className="border px-2 py-1">
                              {f.pago ? (
                                <span className="text-green-600">Pagado ({f.pago.medio})</span>
                              ) : (
                                <span className="text-gray-500">Pendiente</span>
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              {!f.cancelada && !f.pago && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAbrirPagoModal(f)}
                                    className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700"
                                  >
                                    Pago
                                  </button>
                                  <button
                                    onClick={() => handleAbrirCancelarModal(f.id)}
                                    className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nueva Factura */}
      {showFacturaModal && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Facturar Venta {selectedVenta.numeroOrden}</h3>
            <form onSubmit={handleCrearFactura}>
              <div className="mb-3">
                <label className="block text-sm font-medium">Número de Factura *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={facturaForm.numeroFactura} onChange={e => setFacturaForm({...facturaForm, numeroFactura: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Monto *</label>
                <input type="number" step="0.01" className="w-full border rounded px-2 py-1" value={facturaForm.monto} onChange={e => setFacturaForm({...facturaForm, monto: e.target.value})} required />
                <p className="text-xs text-gray-500 mt-1">Saldo pendiente: {formatCurrency(getSaldoPendiente(selectedVenta))}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Fecha</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={facturaForm.fecha} onChange={e => setFacturaForm({...facturaForm, fecha: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowFacturaModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
                <button type="submit" disabled={facturaSending} className="bg-blue-600 text-white px-3 py-1 rounded">{facturaSending ? 'Guardando...' : 'Crear Factura'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Pago */}
      {showPagoModal && selectedFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Pago para Factura {selectedFactura.numeroFactura}</h3>
            <form onSubmit={handleRegistrarPago}>
              <div className="mb-3">
                <label className="block text-sm font-medium">Fecha</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={pagoForm.fecha} onChange={e => setPagoForm({...pagoForm, fecha: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Medio de Pago *</label>
                <select className="w-full border rounded px-2 py-1" value={pagoForm.medio} onChange={e => setPagoForm({...pagoForm, medio: e.target.value})}>
                  <option>Transferencia</option>
                  <option>Efectivo</option>
                  <option>Cheque</option>
                  <option>Tarjeta</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Número de seguimiento / Referencia *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={pagoForm.seguimiento} onChange={e => setPagoForm({...pagoForm, seguimiento: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowPagoModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
                <button type="submit" disabled={pagoSending} className="bg-green-600 text-white px-3 py-1 rounded">{pagoSending ? 'Guardando...' : 'Registrar Pago'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancelar Factura */}
      {showCancelarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Cancelar Factura</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium">Motivo (opcional)</label>
              <textarea className="w-full border rounded px-2 py-1" rows="2" value={cancelarMotivo} onChange={e => setCancelarMotivo(e.target.value)}></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCancelarModal(false)} className="bg-gray-400 text-white px-3 py-1 rounded">No</button>
              <button onClick={handleCancelarFactura} className="bg-red-600 text-white px-3 py-1 rounded">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturaciones;