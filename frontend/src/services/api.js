import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Clientes
export const getClientes = async () => {
  const response = await api.get('/clientes');
  return response.data;
};

export const crearCliente = async (clienteData) => {
  const response = await api.post('/clientes', clienteData);
  return response.data;
};

// Empresas
export const getEmpresas = async () => {
  const response = await api.get('/empresas');
  return response.data;
};

export const crearEmpresa = async (empresaData) => {
  const response = await api.post('/empresas', empresaData);
  return response.data;
};
// Ventas (Órdenes de clientes)
export const getVentas = async () => {
  const response = await api.get('/ventas');
  return response.data;
};

export const crearVenta = async (ventaData) => {
  const response = await api.post('/ventas', ventaData);
  return response.data;
};

export const actualizarVenta = async (id, ventaData) => {
  const response = await api.patch(`/ventas/${id}`, ventaData);
  return response.data;
};

// Facturas y Pagos
export const getFacturas = async () => {
  const response = await api.get('/facturas');
  return response.data;
};

export const crearFactura = async (facturaData) => {
  const response = await api.post('/facturas', facturaData);
  return response.data;
};

export const cancelarFactura = async (id, motivo) => {
  const response = await api.patch(`/facturas/${id}/cancelar`, { motivoCancelacion: motivo });
  return response.data;
};

export const registrarPago = async (pagoData) => {
  const response = await api.post('/pagos', pagoData);
  return response.data;
};

// Cancelar una venta
export const cancelarVenta = async (id) => {
  const response = await api.patch(`/ventas/${id}/cancelar`);
  return response.data;
};

// Editar una venta
export const editarVenta = async (id, ventaData) => {
  const response = await api.put(`/ventas/${id}`, ventaData);
  return response.data;
};

// Editar cliente
export const editarCliente = async (id, clienteData) => {
  const response = await api.put(`/clientes/${id}`, clienteData);
  return response.data;
};

// Eliminar (desactivar) cliente
export const eliminarCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};

// Editar empresa
export const editarEmpresa = async (id, empresaData) => {
  const response = await api.put(`/empresas/${id}`, empresaData);
  return response.data;
};

// Eliminar (desactivar) empresa
export const eliminarEmpresa = async (id) => {
  const response = await api.delete(`/empresas/${id}`);
  return response.data;
};

// Usuarios (solo admin)
export const getUsuarios = async () => {
  const response = await api.get('/usuarios');
  return response.data;
};

export const actualizarRolUsuario = async (id, rol) => {
  const response = await api.put(`/usuarios/${id}/rol`, { rol });
  return response.data;
};

// Compras (Purchase Requests)
export const getCompras = async () => {
  const response = await api.get('/compras');
  return response.data;
};

export const crearCompra = async (data) => {
  const response = await api.post('/compras', data);
  return response.data;
};

export const editarCompra = async (id, data) => {
  const response = await api.put(`/compras/${id}`, data);
  return response.data;
};

export const actualizarDirectriz = async (id, directriz) => {
  const response = await api.patch(`/compras/${id}/directriz`, { directriz });
  return response.data;
};

export const eliminarCompra = async (id) => {
  const response = await api.delete(`/compras/${id}`);
  return response.data;
};

export const getUsuariosSimple = async () => {
  const response = await api.get('/usuarios/simple');
  return response.data;
};

export default api;