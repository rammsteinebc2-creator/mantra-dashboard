const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Configurar ruta de la base de datos desde variable de entorno (para despliegue)
let dbPath = process.env.DATABASE_PATH || './dev.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
process.env.DATABASE_URL = `file:${dbPath}`;

const app = express();
const prisma = new PrismaClient();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (construido en /app/public)
app.use(express.static(path.join(__dirname, '../public')));

const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro_cambiar_en_produccion';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: no tienes permisos suficientes' });
    }
    next();
  };
};

async function actualizarEstadoVenta(ventaId) {
  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    include: { facturas: { include: { pago: true } } }
  });
  if (!venta) return;
  const facturasActivas = venta.facturas.filter(f => !f.cancelada);
  const montoFacturado = facturasActivas.reduce((sum, f) => sum + f.monto, 0);
  const totalVenta = venta.totalConIva;
  let nuevoEstadoFacturacion = 'No facturado';
  if (montoFacturado >= totalVenta) nuevoEstadoFacturacion = 'Facturado';
  else if (montoFacturado > 0) nuevoEstadoFacturacion = 'Facturado parcialmente';
  let nuevoEstadoPago = 'Pendiente';
  const todasPagadas = facturasActivas.length > 0 && facturasActivas.every(f => f.pago !== null);
  if (todasPagadas) {
    const montoPagado = facturasActivas.reduce((sum, f) => sum + (f.pago ? f.monto : 0), 0);
    if (montoPagado >= totalVenta) nuevoEstadoPago = 'Pagado';
    else nuevoEstadoPago = 'Parcial';
  } else if (facturasActivas.some(f => f.pago !== null)) {
    nuevoEstadoPago = 'Parcial';
  }
  await prisma.venta.update({
    where: { id: ventaId },
    data: { facturacion: nuevoEstadoFacturacion, pago: nuevoEstadoPago }
  });
}

// ===== AUTENTICACIÓN =====
app.post('/api/registro', async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ error: 'El email ya está registrado' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: { email, password: hashedPassword, nombre: nombre || null, rol: rol || 'usuario' }
    });
    const token = jwt.sign({ id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email, nombre: nuevoUsuario.nombre, rol: nuevoUsuario.rol } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/perfil', verificarToken, (req, res) => {
  res.json({ usuario: req.usuario });
});

// ===== RUTAS PROTEGIDAS =====
// Dashboard
app.get('/api/dashboard', verificarToken, verificarRol(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']), async (req, res) => {
  try {
    const ordenesActivas = await prisma.ordenTrabajo.count({ where: { estado: { in: ['Pendiente', 'En Proceso'] } } });
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const manana = new Date(hoy); manana.setDate(manana.getDate()+1);
    const ordenesCompletadasHoy = await prisma.ordenTrabajo.count({ where: { estado: 'Completada', updatedAt: { gte: hoy, lt: manana } } });
    const materialesBajoStock = await prisma.material.count({ where: { bajoStock: { not: null }, stock: { lte: prisma.material.fields.bajoStock } } });
    const totalOrdenes = await prisma.ordenTrabajo.count();
    const totalClientes = await prisma.cliente.count();
    res.json({ ordenesActivas, ordenesCompletadasHoy, materialesBajoStock, totalOrdenes, totalClientes });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Clientes
app.get('/api/clientes', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({ orderBy: { nombre: 'asc' } });
    res.json(clientes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/clientes', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { nombre, empresaId, telefono, email, direccion } = req.body;
    if (!nombre || !empresaId) return res.status(400).json({ error: 'Nombre y empresa son obligatorios' });
    const nuevoCliente = await prisma.cliente.create({
      data: { nombre, empresaId: parseInt(empresaId), telefono: telefono || null, email: email || null, direccion: direccion || null },
      include: { empresa: true }
    });
    res.status(201).json(nuevoCliente);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/clientes/:id', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, empresaId, telefono, email, direccion } = req.body;
    const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!cliente.activo) return res.status(400).json({ error: 'No se puede editar un cliente desactivado' });
    if (!nombre || !empresaId) return res.status(400).json({ error: 'Nombre y empresa son obligatorios' });
    const clienteActualizado = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { nombre, empresaId: parseInt(empresaId), telefono: telefono || null, email: email || null, direccion: direccion || null },
      include: { empresa: true }
    });
    res.json(clienteActualizado);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/clientes/:id', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!cliente.activo) return res.status(400).json({ error: 'El cliente ya está desactivado' });
    const ordenesActivas = await prisma.ordenTrabajo.count({ where: { clienteId: parseInt(id) } });
    const ventasActivas = await prisma.venta.count({ where: { clienteId: parseInt(id), estado: 'Activa' } });
    if (ordenesActivas > 0 || ventasActivas > 0) {
      return res.status(400).json({ error: 'No se puede desactivar un cliente con órdenes o ventas activas' });
    }
    const clienteDesactivado = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
    res.json(clienteDesactivado);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Empresas
app.get('/api/empresas', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({ orderBy: { nombre: 'asc' } });
    res.json(empresas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/empresas', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { nombre, direccion, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' });
    const nuevaEmpresa = await prisma.empresa.create({ data: { nombre, direccion, telefono, email } });
    res.status(201).json(nuevaEmpresa);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/empresas/:id', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, email } = req.body;
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    if (!empresa.activo) return res.status(400).json({ error: 'No se puede editar una empresa desactivada' });
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const nombreExistente = await prisma.empresa.findFirst({
      where: { nombre, id: { not: parseInt(id) }, activo: true }
    });
    if (nombreExistente) return res.status(400).json({ error: 'Ya existe otra empresa activa con ese nombre' });
    const empresaActualizada = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { nombre, direccion: direccion || null, telefono: telefono || null, email: email || null }
    });
    res.json(empresaActualizada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/empresas/:id', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    if (!empresa.activo) return res.status(400).json({ error: 'La empresa ya está desactivada' });
    const clientesActivos = await prisma.cliente.count({ where: { empresaId: parseInt(id), activo: true } });
    if (clientesActivos > 0) {
      return res.status(400).json({ error: 'No se puede desactivar una empresa con clientes activos' });
    }
    const empresaDesactivada = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
    res.json(empresaDesactivada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Máquinas
app.get('/api/maquinas', verificarToken, verificarRol(['admin', 'supervisor']), async (req, res) => {
  try {
    const maquinas = await prisma.maquina.findMany({ orderBy: { nombre: 'asc' } });
    res.json(maquinas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/maquinas', verificarToken, verificarRol(['admin', 'supervisor']), async (req, res) => {
  try {
    const { nombre, descripcion, disponible } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const nuevaMaquina = await prisma.maquina.create({
      data: { nombre, descripcion: descripcion || null, disponible: disponible !== undefined ? disponible : true }
    });
    res.status(201).json(nuevaMaquina);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Materiales
app.get('/api/materiales', verificarToken, verificarRol(['admin', 'facturacion', 'almacen']), async (req, res) => {
  try {
    const materiales = await prisma.material.findMany({ orderBy: { nombre: 'asc' } });
    res.json(materiales);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/materiales', verificarToken, verificarRol(['admin', 'facturacion', 'almacen']), async (req, res) => {
  try {
    const { nombre, stock, unidad, bajoStock } = req.body;
    if (!nombre || stock === undefined || !unidad) return res.status(400).json({ error: 'Nombre, stock y unidad son obligatorios' });
    const nuevoMaterial = await prisma.material.create({
      data: { nombre, stock: parseInt(stock), unidad, bajoStock: bajoStock ? parseInt(bajoStock) : null }
    });
    res.status(201).json(nuevoMaterial);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/materiales/:id/stock', verificarToken, verificarRol(['admin', 'facturacion', 'almacen']), async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined) return res.status(400).json({ error: 'El stock es requerido' });
    const materialActualizado = await prisma.material.update({
      where: { id: parseInt(id) }, data: { stock: parseInt(stock) }
    });
    res.json(materialActualizado);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Órdenes de trabajo
app.get('/api/ordenes', verificarToken, verificarRol(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']), async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: { cliente: { include: { empresa: true } }, maquinas: { include: { maquina: true } } },
      orderBy: { fechaInicio: 'desc' }
    });
    res.json(ordenes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/ordenes', verificarToken, verificarRol(['admin', 'ventas', 'facturacion', 'produccion', 'supervisor']), async (req, res) => {
  try {
    const { numeroOrden, clienteId, pieza, cantidad, fechaEntrega, estado, maquinasAsignadas } = req.body;
    if (!numeroOrden || !clienteId || !pieza || !cantidad) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const nuevaOrden = await prisma.ordenTrabajo.create({
      data: { numeroOrden, clienteId, pieza, cantidad, fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null, estado: estado || 'Pendiente' }
    });
    if (maquinasAsignadas && maquinasAsignadas.length > 0) {
      await prisma.asignacionMaquina.createMany({
        data: maquinasAsignadas.map(maq => ({ ordenId: nuevaOrden.id, maquinaId: maq.maquinaId, horasUso: maq.horasUso || null }))
      });
    }
    const ordenCompleta = await prisma.ordenTrabajo.findUnique({
      where: { id: nuevaOrden.id },
      include: { cliente: { include: { empresa: true } }, maquinas: { include: { maquina: true } } }
    });
    res.status(201).json(ordenCompleta);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Ventas
app.get('/api/ventas', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const ventas = await prisma.venta.findMany({ include: { cliente: { include: { empresa: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(ventas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/ventas', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { numeroOrden, clienteId, cantidadPiezas, moneda, montoTotal, fechaEntrega, facturacion, pago } = req.body;
    if (!numeroOrden || !clienteId || !cantidadPiezas || !moneda || montoTotal === undefined || !fechaEntrega) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (incluye fecha de entrega)' });
    }
    let iva = 0;
    if (moneda === 'MXN') iva = montoTotal * 0.16;
    const totalConIva = montoTotal + iva;
    const avisoFacturar = facturacion !== 'Facturado';
    const nuevaVenta = await prisma.venta.create({
      data: {
        numeroOrden,
        clienteId: parseInt(clienteId),
        cantidadPiezas: parseInt(cantidadPiezas),
        moneda,
        montoTotal: parseFloat(montoTotal),
        iva,
        totalConIva,
        fechaEntrega: new Date(fechaEntrega),
        facturacion: facturacion || 'No facturado',
        pago: pago || 'Pendiente',
        avisoFacturar
      },
      include: { cliente: { include: { empresa: true } } }
    });
    res.status(201).json(nuevaVenta);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Editar venta
app.put('/api/ventas/:id', verificarToken, verificarRol(['admin', 'ventas']), async (req, res) => {
  try {
    const { id } = req.params;
    const { numeroOrden, clienteId, cantidadPiezas, moneda, montoTotal, fechaEntrega } = req.body;
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: { facturas: true }
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    if (venta.facturas.length > 0) {
      return res.status(400).json({ error: 'No se puede editar una venta que ya tiene facturas asociadas' });
    }
    if (venta.estado === 'Cancelada') {
      return res.status(400).json({ error: 'No se puede editar una venta cancelada' });
    }
    let iva = 0;
    if (moneda === 'MXN') iva = montoTotal * 0.16;
    const totalConIva = montoTotal + iva;
    const ventaActualizada = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: {
        numeroOrden,
        clienteId: parseInt(clienteId),
        cantidadPiezas: parseInt(cantidadPiezas),
        moneda,
        montoTotal: parseFloat(montoTotal),
        iva,
        totalConIva,
        fechaEntrega: new Date(fechaEntrega)
      },
      include: { cliente: { include: { empresa: true } } }
    });
    res.json(ventaActualizada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Cancelar venta
app.patch('/api/ventas/:id/cancelar', verificarToken, verificarRol(['admin', 'ventas']), async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: { facturas: { include: { pago: true } } }
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    if (venta.estado === 'Cancelada') return res.status(400).json({ error: 'La venta ya está cancelada' });
    if (venta.pago === 'Pagado') return res.status(400).json({ error: 'No se puede cancelar una venta completamente pagada' });
    for (const factura of venta.facturas) {
      if (!factura.cancelada && !factura.pago) {
        await prisma.factura.update({
          where: { id: factura.id },
          data: { cancelada: true, motivoCancelacion: 'Venta cancelada' }
        });
      }
    }
    const ventaCancelada = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: { estado: 'Cancelada', facturacion: 'Cancelada', pago: 'Cancelado' }
    });
    res.json(ventaCancelada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Facturaciones
app.get('/api/facturas', verificarToken, verificarRol(['admin', 'facturacion']), async (req, res) => {
  try {
    const facturas = await prisma.factura.findMany({
      include: { venta: { include: { cliente: { include: { empresa: true } } } }, pago: true },
      orderBy: { fecha: 'desc' }
    });
    res.json(facturas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/facturas', verificarToken, verificarRol(['admin', 'facturacion']), async (req, res) => {
  try {
    const { ventaId, numeroFactura, monto, fecha, motivoCancelacion } = req.body;
    if (!ventaId || !numeroFactura || !monto) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(ventaId) },
      include: { facturas: { where: { cancelada: false } } }
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    const montoFacturado = venta.facturas.reduce((sum, f) => sum + f.monto, 0);
    const saldoPendiente = venta.totalConIva - montoFacturado;
    if (parseFloat(monto) > saldoPendiente) return res.status(400).json({ error: `El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)}).` });
    const nuevaFactura = await prisma.factura.create({
      data: { ventaId: parseInt(ventaId), numeroFactura, monto: parseFloat(monto), fecha: fecha ? new Date(fecha) : new Date(), motivoCancelacion: motivoCancelacion || null },
      include: { venta: { include: { cliente: { include: { empresa: true } } } }, pago: true }
    });
    await actualizarEstadoVenta(parseInt(ventaId));
    res.status(201).json(nuevaFactura);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/facturas/:id/cancelar', verificarToken, verificarRol(['admin', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoCancelacion } = req.body;
    const factura = await prisma.factura.findUnique({ where: { id: parseInt(id) }, include: { venta: true } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    if (factura.cancelada) return res.status(400).json({ error: 'La factura ya está cancelada' });
    const facturaCancelada = await prisma.factura.update({
      where: { id: parseInt(id) },
      data: { cancelada: true, motivoCancelacion: motivoCancelacion || null }
    });
    await actualizarEstadoVenta(factura.ventaId);
    res.json(facturaCancelada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pagos', verificarToken, verificarRol(['admin', 'facturacion']), async (req, res) => {
  try {
    const { facturaId, fecha, medio, seguimiento } = req.body;
    if (!facturaId || !medio || !seguimiento) return res.status(400).json({ error: 'Factura, medio de pago y número de seguimiento son obligatorios' });
    const pagoExistente = await prisma.pago.findUnique({ where: { facturaId: parseInt(facturaId) } });
    if (pagoExistente) return res.status(400).json({ error: 'Esta factura ya tiene un pago registrado' });
    const nuevoPago = await prisma.pago.create({
      data: { facturaId: parseInt(facturaId), fecha: fecha ? new Date(fecha) : new Date(), medio, seguimiento: seguimiento || null },
      include: { factura: { include: { venta: { include: { cliente: { include: { empresa: true } } } } } } }
    });
    const factura = await prisma.factura.findUnique({ where: { id: parseInt(facturaId) }, select: { ventaId: true } });
    if (factura) await actualizarEstadoVenta(factura.ventaId);
    res.status(201).json(nuevoPago);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Administración de usuarios
app.get('/api/usuarios', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(usuarios);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/usuarios/:id/rol', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    const rolesValidos = ['admin', 'ventas', 'facturacion', 'almacen', 'compras', 'produccion', 'supervisor', 'usuario'];
    if (!rol || !rolesValidos.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (parseInt(id) === req.usuario.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { rol },
      select: { id: true, email: true, nombre: true, rol: true }
    });
    res.json(usuarioActualizado);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Compras
app.get('/api/compras', verificarToken, verificarRol(['admin', 'compras', 'supervisor']), async (req, res) => {
  try {
    const requests = await prisma.purchaseRequest.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(requests);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/compras', verificarToken, verificarRol(['admin', 'compras', 'supervisor']), async (req, res) => {
  try {
    const { solicitante, proyecto, material, dibujo, ancho, largo, grosor, diametro, fechaRequerida, descripcion, numeroPiezas, proveedor1, proveedor2, proveedor3, proveedorElegido, dimensionesCotizadas, propuestaAlternativa, tiempoEntrega, fechaCompra } = req.body;
    if (!solicitante || !proyecto || !material || !fechaRequerida || !numeroPiezas) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const nuevaSolicitud = await prisma.purchaseRequest.create({
      data: {
        solicitante, proyecto, material, dibujo: dibujo || null,
        ancho: ancho ? parseFloat(ancho) : null, largo: largo ? parseFloat(largo) : null, grosor: grosor ? parseFloat(grosor) : null, diametro: diametro ? parseFloat(diametro) : null,
        fechaRequerida: new Date(fechaRequerida), descripcion: descripcion || null, numeroPiezas: parseInt(numeroPiezas),
        proveedor1: proveedor1 || null, proveedor2: proveedor2 || null, proveedor3: proveedor3 || null,
        proveedorElegido: proveedorElegido || null, dimensionesCotizadas: dimensionesCotizadas || null,
        propuestaAlternativa: propuestaAlternativa || null, tiempoEntrega: tiempoEntrega || null,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null
      }
    });
    res.status(201).json(nuevaSolicitud);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/compras/:id', verificarToken, verificarRol(['admin', 'compras', 'supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData.ancho) updateData.ancho = parseFloat(updateData.ancho);
    if (updateData.largo) updateData.largo = parseFloat(updateData.largo);
    if (updateData.grosor) updateData.grosor = parseFloat(updateData.grosor);
    if (updateData.diametro) updateData.diametro = parseFloat(updateData.diametro);
    if (updateData.numeroPiezas) updateData.numeroPiezas = parseInt(updateData.numeroPiezas);
    if (updateData.fechaRequerida) updateData.fechaRequerida = new Date(updateData.fechaRequerida);
    if (updateData.fechaCompra) updateData.fechaCompra = new Date(updateData.fechaCompra);
    const solicitudActualizada = await prisma.purchaseRequest.update({ where: { id: parseInt(id) }, data: updateData });
    res.json(solicitudActualizada);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/compras/:id/directriz', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { directriz } = req.body;
    if (!directriz || !['comprar', 'cancelar', 'esperar'].includes(directriz)) return res.status(400).json({ error: 'Directriz inválida' });
    const solicitud = await prisma.purchaseRequest.update({ where: { id: parseInt(id) }, data: { directriz } });
    res.json(solicitud);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/compras/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.purchaseRequest.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Solicitud eliminada correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/simple', verificarToken, verificarRol(['admin', 'compras', 'supervisor']), async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({ select: { id: true, nombre: true, email: true }, orderBy: { nombre: 'asc' } });
    res.json(usuarios);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dashboard/stats', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const manana = new Date(hoy); manana.setDate(manana.getDate()+1);
    const ordenesActivas = await prisma.ordenTrabajo.count({ where: { estado: { in: ['Pendiente', 'En Proceso'] } } });
    const ordenesConAtraso = await prisma.ordenTrabajo.count({ where: { estado: { not: 'Completada' }, fechaEntrega: { lt: new Date() } } });
    const materialesBajoStock = await prisma.material.count({ where: { bajoStock: { not: null }, stock: { lte: prisma.material.fields.bajoStock } } });
    let totalClientes = 0, totalMaquinas = 0, ventasMes = 0, facturasPendientes = 0, ordenesCompletadasHoy = 0, maquinasDisponibles = 0, solicitudesCompraPendientes = 0;
    if (rol === 'admin') {
      totalClientes = await prisma.cliente.count({ where: { activo: true } });
      totalMaquinas = await prisma.maquina.count();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const ventasAgg = await prisma.venta.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { totalConIva: true } });
      ventasMes = ventasAgg._sum?.totalConIva || 0;
      facturasPendientes = await prisma.factura.count({ where: { pago: null, cancelada: false } });
    }
    if (rol === 'admin' || rol === 'ventas' || rol === 'facturacion') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const ventasAgg = await prisma.venta.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { totalConIva: true } });
      ventasMes = ventasAgg._sum?.totalConIva || 0;
      facturasPendientes = await prisma.factura.count({ where: { pago: null, cancelada: false } });
    }
    if (rol === 'admin' || rol === 'produccion' || rol === 'supervisor') {
      ordenesCompletadasHoy = await prisma.ordenTrabajo.count({ where: { estado: 'Completada', updatedAt: { gte: hoy, lt: manana } } });
    }
    if (rol === 'admin' || rol === 'supervisor') {
      maquinasDisponibles = await prisma.maquina.count({ where: { disponible: true } });
    }
    if (rol === 'admin' || rol === 'compras') {
      solicitudesCompraPendientes = await prisma.purchaseRequest.count({ where: { directriz: 'esperar' } });
    }
    res.json({ ordenesActivas, ordenesConAtraso, materialesBajoStock, totalClientes, totalMaquinas, ventasMes, facturasPendientes, ordenesCompletadasHoy, maquinasDisponibles, solicitudesCompraPendientes });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Middleware para manejar rutas no API (client-side routing)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ===== CONFIGURACIÓN DE MULTER (subida de archivos PDF) =====
const multer = require('multer');

// Configurar almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Crear la carpeta si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp + número de orden + extensión
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `venta-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

// Filtro para solo aceptar PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
  fileFilter: fileFilter
});

// Servir archivos estáticos desde la carpeta uploads (para descargar)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== SUBIR PDF PARA UNA VENTA =====
app.post('/api/ventas/:id/pdf', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({ where: { id: parseInt(id) } });
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo PDF' });
    }

    // Guardar la ruta del archivo en la base de datos (relativa)
    const pdfUrl = `/uploads/${req.file.filename}`;
    const ventaActualizada = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: { pdfUrl },
      include: { cliente: { include: { empresa: true } } }
    });

    res.json(ventaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ELIMINAR PDF DE UNA VENTA =====
app.delete('/api/ventas/:id/pdf', verificarToken, verificarRol(['admin', 'ventas', 'facturacion']), async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({ where: { id: parseInt(id) } });
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (!venta.pdfUrl) {
      return res.status(400).json({ error: 'Esta venta no tiene PDF asociado' });
    }

    // Eliminar el archivo físico del servidor
    const filePath = path.join(__dirname, 'uploads', path.basename(venta.pdfUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Actualizar la base de datos
    const ventaActualizada = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: { pdfUrl: null },
      include: { cliente: { include: { empresa: true } } }
    });

    res.json(ventaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DESCARGAR PDF DE UNA VENTA =====
app.get('/api/ventas/:id/pdf', async (req, res) => {
  // Verificar token desde header o query
  let token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Opcional: verificar que el usuario tenga rol adecuado (puedes agregar verificarRol si quieres)
    const usuario = decoded;
    if (!usuario) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    // Continuar con la lógica
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({ where: { id: parseInt(id) } });
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (!venta.pdfUrl) {
      return res.status(404).json({ error: 'Esta venta no tiene PDF asociado' });
    }
    const filePath = path.join(__dirname, 'uploads', path.basename(venta.pdfUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'El archivo PDF no existe en el servidor' });
    }
    res.sendFile(filePath, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});