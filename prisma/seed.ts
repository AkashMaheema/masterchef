import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@masterchef.com' },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: 'admin@masterchef.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  
  console.log("Seeded database with admin user:")
  console.log("Email: admin@masterchef.com")
  console.log("Password: admin123")
  console.log("Role:", admin.role)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
