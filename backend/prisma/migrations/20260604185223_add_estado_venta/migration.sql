-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroOrden" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "cantidadPiezas" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL,
    "montoTotal" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "totalConIva" REAL NOT NULL,
    "facturacion" TEXT NOT NULL DEFAULT 'No facturado',
    "pago" TEXT NOT NULL DEFAULT 'Pendiente',
    "avisoFacturar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Venta" ("avisoFacturar", "cantidadPiezas", "clienteId", "createdAt", "facturacion", "fechaCreacion", "fechaEntrega", "id", "iva", "moneda", "montoTotal", "numeroOrden", "pago", "totalConIva", "updatedAt") SELECT "avisoFacturar", "cantidadPiezas", "clienteId", "createdAt", "facturacion", "fechaCreacion", "fechaEntrega", "id", "iva", "moneda", "montoTotal", "numeroOrden", "pago", "totalConIva", "updatedAt" FROM "Venta";
DROP TABLE "Venta";
ALTER TABLE "new_Venta" RENAME TO "Venta";
CREATE UNIQUE INDEX "Venta_numeroOrden_key" ON "Venta"("numeroOrden");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
