import { PrismaClient, VendorCategory, EventType } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing service categories
  await prisma.service_categories.deleteMany()

  // Create service categories
  const categories = [
    {
      name: 'Cake',
      category: VendorCategory.cake,
      icon: '🎂',
      description: 'Wedding cakes, birthday cakes, and special occasion desserts',
      event_types: [EventType.wedding, EventType.christening, EventType.party, EventType.kids_party]
    },
    {
      name: 'Dress',
      category: VendorCategory.dress,
      icon: '👗',
      description: 'Wedding dresses, formal wear, and special occasion attire',
      event_types: [EventType.wedding, EventType.christening, EventType.party]
    },
    {
      name: 'Florist',
      category: VendorCategory.florist,
      icon: '🌸',
      description: 'Flower arrangements, bouquets, and decorative floral designs',
      event_types: [EventType.wedding, EventType.christening, EventType.party]
    },
    {
      name: 'Jeweller',
      category: VendorCategory.jeweller,
      icon: '💍',
      description: 'Wedding rings, engagement rings, and fine jewelry',
      event_types: [EventType.wedding, EventType.christening]
    },
    {
      name: 'Music',
      category: VendorCategory.music,
      icon: '🎵',
      description: 'Live bands, DJs, and musical entertainment',
      event_types: [EventType.wedding, EventType.christening, EventType.party, EventType.kids_party]
    },
    {
      name: 'Photographer',
      category: VendorCategory.photographer,
      icon: '📸',
      description: 'Professional photography and photo services',
      event_types: [EventType.wedding, EventType.christening, EventType.party, EventType.kids_party]
    },
    {
      name: 'Transportation',
      category: VendorCategory.transportation,
      icon: '🚗',
      description: 'Luxury cars, limousines, and transportation services',
      event_types: [EventType.wedding, EventType.christening, EventType.party]
    },
    {
      name: 'Venue',
      category: VendorCategory.venue,
      icon: '🏛️',
      description: 'Event venues, reception spaces, and celebration locations',
      event_types: [EventType.wedding, EventType.christening, EventType.party, EventType.kids_party]
    },
    {
      name: 'Videographer',
      category: VendorCategory.videographer,
      icon: '🎥',
      description: 'Professional video recording and cinematography',
      event_types: [EventType.wedding, EventType.christening, EventType.party]
    }
  ]

  for (const category of categories) {
    await prisma.service_categories.create({
      data: category
    })
    console.log(`✅ Created category: ${category.name}`)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
