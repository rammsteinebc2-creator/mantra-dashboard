try {
  const adapterPackage = require('@prisma/adapter-better-sqlite3');
  console.log('Contenido completo:', JSON.stringify(adapterPackage, null, 2));
  console.log('Tipo:', typeof adapterPackage);
  if (adapterPackage && typeof adapterPackage === 'object') {
    console.log('Propiedades:', Object.keys(adapterPackage));
    // Intentar ver si hay un constructor llamado PrismaBetterSQLite3
    if (adapterPackage.PrismaBetterSQLite3) {
      console.log('PrismaBetterSQLite3 está presente como propiedad');
    }
  }
} catch (err) {
  console.error('Error al cargar el adaptador:', err.message);
}