import { seedDatabase } from './seed.js'

const result = seedDatabase()
if (result.seeded) console.log('Seeded a fresh Touchline database.')
else console.log('Database already contains data; nothing to seed.')
