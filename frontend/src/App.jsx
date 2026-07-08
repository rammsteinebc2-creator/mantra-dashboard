import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Empresas from './pages/Empresas';
import Ordenes from './pages/Ordenes';
import Maquinas from './pages/Maquinas';
import Materiales from './pages/Materiales';
import Ventas from './pages/Ventas';
import Facturaciones from './pages/Facturaciones';
import RutaProtegida from './components/RutaProtegida';
import Usuarios from './pages/Usuarios';
import Compras from './pages/Compras';
import logo from './assets/logo.png'; // Ajusta la ruta según tu archivo

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState({
    ventas: false,
    ordenes: false,
    compras: false,
    rh: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setLoading(false);
  }, []);

  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const puedeVer = (rolesPermitidos) => {
    if (!usuario) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-3">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Logo */}
              <img src={logo} alt="Logo" className="h-16 w-auto" />

              {/* Dashboard - enlace directo */}
              {puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']) && (
                <Link to="/" className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">Dashboard</Link>
              )}

              {/* Menú Ventas */}
              {(puedeVer(['admin', 'ventas', 'facturacion'])) && (
                <div
                  className="relative"
                  onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, ventas: true }))}
                  onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, ventas: false }))}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Ventas
                  </button>
                  {menuAbierto.ventas && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, ventas: true }))}
                      onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, ventas: false }))}
                    >
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/ventas" className="block px-4 py-2 hover:bg-gray-100">Previsión de Ventas</Link>
                      )}
                      {puedeVer(['admin', 'facturacion']) && (
                        <Link to="/facturaciones" className="block px-4 py-2 hover:bg-gray-100">Facturaciones</Link>
                      )}
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/clientes" className="block px-4 py-2 hover:bg-gray-100">Clientes</Link>
                      )}
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/empresas" className="block px-4 py-2 hover:bg-gray-100">Empresas</Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Menú Órdenes de trabajo */}
              {(puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor'])) && (
                <div
                  className="relative"
                  onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, ordenes: true }))}
                  onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, ordenes: false }))}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Órdenes de trabajo
                  </button>
                  {menuAbierto.ordenes && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, ordenes: true }))}
                      onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, ordenes: false }))}
                    >
                      {puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']) && (
                        <Link to="/ordenes" className="block px-4 py-2 hover:bg-gray-100">Órdenes</Link>
                      )}
                      {puedeVer(['admin', 'supervisor']) && (
                        <Link to="/maquinas" className="block px-4 py-2 hover:bg-gray-100">Máquinas</Link>
                      )}
                      <span className="block px-4 py-2 text-gray-400 cursor-not-allowed">Proyectos (próximamente)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Menú Compras */}
              {(puedeVer(['admin', 'compras', 'supervisor'])) && (
                <div
                  className="relative"
                  onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, compras: true }))}
                  onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, compras: false }))}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Compras
                  </button>
                  {menuAbierto.compras && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, compras: true }))}
                      onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, compras: false }))}
                    >
                      {puedeVer(['admin', 'compras', 'supervisor']) && (
                        <Link to="/compras" className="block px-4 py-2 hover:bg-gray-100">Gestión de compras</Link>
                      )}
                      <span className="block px-4 py-2 text-gray-400 cursor-not-allowed">Proveedores (próximamente)</span>
                      <span className="block px-4 py-2 text-gray-400 cursor-not-allowed">Gestión de pagos (próximamente)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Menú RH */}
              {puedeVer(['admin']) && (
                <div
                  className="relative"
                  onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, rh: true }))}
                  onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, rh: false }))}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    RH
                  </button>
                  {menuAbierto.rh && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => setMenuAbierto(prev => ({ ...prev, rh: true }))}
                      onMouseLeave={() => setMenuAbierto(prev => ({ ...prev, rh: false }))}
                    >
                      <Link to="/usuarios" className="block px-4 py-2 hover:bg-gray-100">Usuarios</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Usuario y logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm">{usuario.nombre || usuario.email} ({usuario.rol})</span>
              <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600">Cerrar sesión</button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={
              <RutaProtegida rolesPermitidos={['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']}>
                <Dashboard />
              </RutaProtegida>
            } />
            <Route path="/clientes" element={
              <RutaProtegida rolesPermitidos={['admin', 'ventas', 'facturacion']}>
                <Clientes />
              </RutaProtegida>
            } />
            <Route path="/empresas" element={
              <RutaProtegida rolesPermitidos={['admin', 'ventas', 'facturacion']}>
                <Empresas />
              </RutaProtegida>
            } />
            <Route path="/ordenes" element={
              <RutaProtegida rolesPermitidos={['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']}>
                <Ordenes />
              </RutaProtegida>
            } />
            <Route path="/maquinas" element={
              <RutaProtegida rolesPermitidos={['admin', 'supervisor']}>
                <Maquinas />
              </RutaProtegida>
            } />
            <Route path="/materiales" element={
              <RutaProtegida rolesPermitidos={['admin', 'facturacion', 'almacen']}>
                <Materiales />
              </RutaProtegida>
            } />
            <Route path="/ventas" element={
              <RutaProtegida rolesPermitidos={['admin', 'ventas', 'facturacion']}>
                <Ventas />
              </RutaProtegida>
            } />
            <Route path="/facturaciones" element={
              <RutaProtegida rolesPermitidos={['admin', 'facturacion']}>
                <Facturaciones />
              </RutaProtegida>
            } />
            <Route path="/usuarios" element={
              <RutaProtegida rolesPermitidos={['admin']}>
                <Usuarios />
              </RutaProtegida>
            } />
            <Route path="/compras" element={
              <RutaProtegida rolesPermitidos={['admin', 'compras', 'supervisor']}>
                <Compras />
              </RutaProtegida>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;