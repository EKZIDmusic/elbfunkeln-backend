import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elbfunkeln.de' },
    update: {},
    create: {
      email: 'admin@elbfunkeln.de',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Elbfunkeln',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Test Customer
  const customer = await prisma.user.upsert({
    where: { email: 'kunde@example.com' },
    update: {},
    create: {
      email: 'kunde@example.com',
      password: hashedPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  console.log('✅ Test customer created:', customer.email);

  // Create Categories
  const categories = [
    {
      name: 'Ringe',
      slug: 'ringe',
      description: 'Handgefertigte Drahtringe',
    },
    {
      name: 'Ohrringe',
      slug: 'ohrringe',
      description: 'Elegante Drahtohrringe',
    },
    {
      name: 'Armb ̈ander',
      slug: 'armbaender',
      description: 'Individuelle Drahtarmbänder',
    },
    {
      name: 'Ketten',
      slug: 'ketten',
      description: 'Kunstvolle Drahtketten',
    },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create Products
  const products = [
    {
      name: 'Silberner Drahtring "Eleganz"',
      slug: 'silberner-drahtring-eleganz',
      description: 'Ein wunderschön geformter Ring aus Silberdraht. Perfekt für jeden Anlass.',
      price: 29.99,
      comparePrice: 39.99,
      sku: 'ELB-RING-001',
      stock: 15,
      categoryId: createdCategories[0].id,
      featured: true,
      weight: 10,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Ring+1',
        'https://placehold.co/600x600/764ba2/white?text=Ring+1+Detail',
      ]),
      metadata: JSON.stringify({
        material: 'Silberdraht',
        size: 'Verstellbar',
        handmade: true,
      }),
    },
    {
      name: 'Goldene Drahtohrringe "Glamour"',
      slug: 'goldene-drahtohrringe-glamour',
      description: 'Elegante Ohrringe aus goldfarbenem Draht. Leicht und komfortabel.',
      price: 34.99,
      sku: 'ELB-OHR-001',
      stock: 20,
      categoryId: createdCategories[1].id,
      featured: true,
      weight: 8,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Ohrringe+1',
        'https://placehold.co/600x600/764ba2/white?text=Ohrringe+1+Detail',
      ]),
      metadata: JSON.stringify({
        material: 'Golddraht',
        length: '3cm',
        handmade: true,
      }),
    },
    {
      name: 'Kupfer Armband "Vintage"',
      slug: 'kupfer-armband-vintage',
      description: 'Rustikales Armband mit Vintage-Charme aus Kupferdraht.',
      price: 24.99,
      sku: 'ELB-ARM-001',
      stock: 10,
      categoryId: createdCategories[2].id,
      featured: false,
      weight: 15,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Armband+1',
      ]),
      metadata: JSON.stringify({
        material: 'Kupferdraht',
        size: 'Verstellbar',
        handmade: true,
      }),
    },
    {
      name: 'Drahtkette "Infinity"',
      slug: 'drahtkette-infinity',
      description: 'Moderne Kette mit Infinity-Symbol aus versilbertem Draht.',
      price: 44.99,
      comparePrice: 54.99,
      sku: 'ELB-KET-001',
      stock: 8,
      categoryId: createdCategories[3].id,
      featured: true,
      weight: 12,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Kette+1',
        'https://placehold.co/600x600/764ba2/white?text=Kette+1+Detail',
      ]),
      metadata: JSON.stringify({
        material: 'Versilberter Draht',
        length: '45cm',
        handmade: true,
      }),
    },
    {
      name: 'Minimalistische Ohrstecker',
      slug: 'minimalistische-ohrstecker',
      description: 'Schlichte Ohrstecker für den Alltag.',
      price: 19.99,
      sku: 'ELB-OHR-002',
      stock: 25,
      categoryId: createdCategories[1].id,
      featured: false,
      weight: 5,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Ohrstecker',
      ]),
      metadata: JSON.stringify({
        material: 'Silberdraht',
        style: 'Minimalistisch',
        handmade: true,
      }),
    },
    {
      name: 'Statement Ring "Bold"',
      slug: 'statement-ring-bold',
      description: 'Auffälliger Ring für besondere Anlässe.',
      price: 39.99,
      sku: 'ELB-RING-002',
      stock: 5,
      categoryId: createdCategories[0].id,
      featured: true,
      weight: 18,
      images: JSON.stringify([
        'https://placehold.co/600x600/667eea/white?text=Statement+Ring',
      ]),
      metadata: JSON.stringify({
        material: 'Silber & Gold',
        size: 'Verstellbar',
        handmade: true,
      }),
    },
  ];

  for (const prod of products) {
    const product = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create Discounts
  const discount1 = await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: 30,
      usageLimit: 100,
      active: true,
      expiresAt: new Date('2025-12-31'),
    },
  });

  const discount2 = await prisma.discount.upsert({
    where: { code: 'SUMMER2024' },
    update: {},
    create: {
      code: 'SUMMER2024',
      type: 'FIXED_AMOUNT',
      value: 5,
      minPurchase: 50,
      usageLimit: 50,
      active: true,
      expiresAt: new Date('2024-08-31'),
    },
  });

  console.log('✅ Discounts created');

  // Create Address for customer
  await prisma.address.create({
    data: {
      userId: customer.id,
      firstName: 'Max',
      lastName: 'Mustermann',
      street: 'Musterstraße 123',
      zip: '12345',
      city: 'Hamburg',
      country: 'DE',
      phone: '+49 123 456789',
      isDefault: true,
    },
  });

  console.log('✅ Test address created');

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@elbfunkeln.de / Admin123!');
  console.log('Customer: kunde@example.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });