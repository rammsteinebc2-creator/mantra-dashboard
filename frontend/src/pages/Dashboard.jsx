import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api'; // para usar el interceptor con token

const Dashboard = () => {
  const [stats, setStats] = useState({
    ordenesActivas: 0,
    ordenesConAtraso: 0,
    materialesBajoStock: 0,
    totalClientes: 0,
    totalMaquinas: 0,
    ventasMes: 0,
    facturasPendientes: 0,
    ordenesCompletadasHoy: 0,
    maquinasDisponibles: 0,
    solicitudesCompraPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) setUsuario(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    cargarDashboard();
  }, []);

  const rol = usuario?.rol || '';

  if (loading) return <div className="p-4">Cargando dashboard...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  // Formateo de moneda
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tarjetas universales */}
        <div className="bg-white rounded-lg shadow p-6 border-l-8 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase">Órdenes Activas</h3>
          <p className="text-4xl font-bold mt-2">{stats.ordenesActivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-8 border-orange-500">
          <h3 className="text-gray-500 text-sm uppercase">Órdenes con Atraso</h3>
          <p className="text-4xl font-bold mt-2">{stats.ordenesConAtraso}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-8 border-red-500">
          <h3 className="text-gray-500 text-sm uppercase">Materiales Bajo Stock</h3>
          <p className="text-4xl font-bold mt-2">{stats.materialesBajoStock}</p>
        </div>

        {/* Admin: clientes, máquinas, ventas mes, facturas pendientes */}
        {rol === 'admin' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-green-500">
              <h3 className="text-gray-500 text-sm uppercase">Total Clientes</h3>
              <p className="text-4xl font-bold mt-2">{stats.totalClientes}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-purple-500">
              <h3 className="text-gray-500 text-sm uppercase">Total Máquinas</h3>
              <p className="text-4xl font-bold mt-2">{stats.totalMaquinas}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-indigo-500">
              <h3 className="text-gray-500 text-sm uppercase">Ventas del Mes</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.ventasMes)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-pink-500">
              <h3 className="text-gray-500 text-sm uppercase">Facturas Pendientes</h3>
              <p className="text-4xl font-bold mt-2">{stats.facturasPendientes}</p>
            </div>
          </>
        )}

        {/* Ventas y Facturación: ventas mes, facturas pendientes */}
        {(rol === 'ventas' || rol === 'facturacion') && (
          <>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-indigo-500">
              <h3 className="text-gray-500 text-sm uppercase">Ventas del Mes</h3>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.ventasMes)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-8 border-pink-500">
              <h3 className="text-gray-500 text-sm uppercase">Facturas Pendientes</h3>
              <p className="text-4xl font-bold mt-2">{stats.facturasPendientes}</p>
            </div>
          </>
        )}

        {/* Producción y Supervisor: órdenes completadas hoy */}
        {(rol === 'produccion' || rol === 'supervisor') && (
          <div className="bg-white rounded-lg shadow p-6 border-l-8 border-teal-500">
            <h3 className="text-gray-500 text-sm uppercase">Órdenes Completadas Hoy</h3>
            <p className="text-4xl font-bold mt-2">{stats.ordenesCompletadasHoy}</p>
          </div>
        )}

        {/* Supervisor: máquinas disponibles */}
        {rol === 'supervisor' && (
          <div className="bg-white rounded-lg shadow p-6 border-l-8 border-cyan-500">
            <h3 className="text-gray-500 text-sm uppercase">Máquinas Disponibles</h3>
            <p className="text-4xl font-bold mt-2">{stats.maquinasDisponibles}</p>
          </div>
        )}

        {/* Compras: solicitudes de compra pendientes */}
        {rol === 'compras' && (
          <div className="bg-white rounded-lg shadow p-6 border-l-8 border-amber-500">
            <h3 className="text-gray-500 text-sm uppercase">Solicitudes Compra Pendientes</h3>
            <p className="text-4xl font-bold mt-2">{stats.solicitudesCompraPendientes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;