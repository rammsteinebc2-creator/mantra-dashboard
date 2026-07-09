import { useState, useEffect, useRef } from 'react';
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
import logo from './assets/logo.png';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState({
    ventas: false,
    ordenes: false,
    compras: false,
    rh: false
  });

  // Referencias para los temporizadores de cada menú
  const timers = useRef({
    ventas: null,
    ordenes: null,
    compras: null,
    rh: null
  });

  // Función para abrir un menú (limpia el temporizador de cierre)
  const abrirMenu = (nombre) => {
    if (timers.current[nombre]) {
      clearTimeout(timers.current[nombre]);
      timers.current[nombre] = null;
    }
    setMenuAbierto(prev => ({ ...prev, [nombre]: true }));
  };

  // Función para cerrar un menú con retraso de 2 segundos
  const cerrarMenuConDelay = (nombre) => {
    if (timers.current[nombre]) {
      clearTimeout(timers.current[nombre]);
    }
    timers.current[nombre] = setTimeout(() => {
      setMenuAbierto(prev => ({ ...prev, [nombre]: false }));
      timers.current[nombre] = null;
    }, 2000);
  };

  // Función para cerrar un menú inmediatamente (al hacer clic)
  const cerrarMenuInmediato = (nombre) => {
    if (timers.current[nombre]) {
      clearTimeout(timers.current[nombre]);
      timers.current[nombre] = null;
    }
    setMenuAbierto(prev => ({ ...prev, [nombre]: false }));
  };

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
              <img src={logo} alt="Logo" className="h-16 w-auto" />

              {puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']) && (
                <Link to="/" className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">Dashboard</Link>
              )}

              {/* Menú Ventas */}
              {(puedeVer(['admin', 'ventas', 'facturacion'])) && (
                <div
                  className="relative"
                  onMouseEnter={() => abrirMenu('ventas')}
                  onMouseLeave={() => cerrarMenuConDelay('ventas')}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Ventas
                  </button>
                  {menuAbierto.ventas && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => abrirMenu('ventas')}
                      onMouseLeave={() => cerrarMenuConDelay('ventas')}
                    >
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/ventas" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ventas')}>Previsión de Ventas</Link>
                      )}
                      {puedeVer(['admin', 'facturacion']) && (
                        <Link to="/facturaciones" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ventas')}>Facturaciones</Link>
                      )}
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/clientes" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ventas')}>Clientes</Link>
                      )}
                      {puedeVer(['admin', 'ventas', 'facturacion']) && (
                        <Link to="/empresas" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ventas')}>Empresas</Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Menú Órdenes de trabajo */}
              {(puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor'])) && (
                <div
                  className="relative"
                  onMouseEnter={() => abrirMenu('ordenes')}
                  onMouseLeave={() => cerrarMenuConDelay('ordenes')}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Órdenes de trabajo
                  </button>
                  {menuAbierto.ordenes && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => abrirMenu('ordenes')}
                      onMouseLeave={() => cerrarMenuConDelay('ordenes')}
                    >
                      {puedeVer(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']) && (
                        <Link to="/ordenes" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ordenes')}>Órdenes</Link>
                      )}
                      {puedeVer(['admin', 'supervisor']) && (
                        <Link to="/maquinas" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('ordenes')}>Máquinas</Link>
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
                  onMouseEnter={() => abrirMenu('compras')}
                  onMouseLeave={() => cerrarMenuConDelay('compras')}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    Compras
                  </button>
                  {menuAbierto.compras && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => abrirMenu('compras')}
                      onMouseLeave={() => cerrarMenuConDelay('compras')}
                    >
                      {puedeVer(['admin', 'compras', 'supervisor']) && (
                        <Link to="/compras" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('compras')}>Gestión de compras</Link>
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
                  onMouseEnter={() => abrirMenu('rh')}
                  onMouseLeave={() => cerrarMenuConDelay('rh')}
                >
                  <button className="px-3 py-1 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors self-center">
                    RH
                  </button>
                  {menuAbierto.rh && (
                    <div
                      className="absolute left-0 top-full mt-1 w-48 bg-white text-black rounded shadow-lg overflow-hidden z-20"
                      onMouseEnter={() => abrirMenu('rh')}
                      onMouseLeave={() => cerrarMenuConDelay('rh')}
                    >
                      <Link to="/usuarios" className="block px-4 py-2 hover:bg-gray-100" onClick={() => cerrarMenuInmediato('rh')}>Usuarios</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

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