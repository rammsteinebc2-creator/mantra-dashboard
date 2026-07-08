import { defineConfig } from 'prisma/config'
import 'dotenv/config'  // Carga las variables de entorno desde .env

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
})