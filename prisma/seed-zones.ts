import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zone definitions mapped to governorates
const zonesData = [
  {
    name: 'Zone A',
    nameAr: 'المنطقة أ',
    code: 'ZONE-A',
    description: 'Capital Governorate coverage - Manama and surrounding areas',
    governorateName: 'Capital Governorate',
  },
  {
    name: 'Zone B',
    nameAr: 'المنطقة ب',
    code: 'ZONE-B',
    description: 'Muharraq Governorate coverage - Muharraq Island and surrounding areas',
    governorateName: 'Muharraq Governorate',
  },
  {
    name: 'Zone C',
    nameAr: 'المنطقة ج',
    code: 'ZONE-C',
    description: 'Northern Governorate coverage - Northern region areas',
    governorateName: 'Northern Governorate',
  },
  {
    name: 'Zone D',
    nameAr: 'المنطقة د',
    code: 'ZONE-D',
    description: 'Southern Governorate coverage - Riffa and southern areas',
    governorateName: 'Southern Governorate',
  },
];

async function main() {
  console.log('🌱 Seeding Zones and Zone-Area mappings...\n');

  // Step 1: Delete existing zones and zone-area mappings
  console.log('📛 Deleting existing zones and mappings...');

  try {
    const deletedZoneAreas = await prisma.zoneArea.deleteMany({});
    console.log(`  Deleted ${deletedZoneAreas.count} zone-area mappings`);
  } catch (e) {
    console.log('  No zone-area mappings to delete');
  }

  try {
    const deletedZones = await prisma.zone.deleteMany({});
    console.log(`  Deleted ${deletedZones.count} zones`);
  } catch (e) {
    console.log('  No zones to delete');
  }

  // Step 2: Create zones and map areas
  console.log('\n🗺️ Creating zones and mapping areas...\n');

  for (const zoneData of zonesData) {
    console.log(`Creating ${zoneData.name} (${zoneData.nameAr})...`);

    // Create the zone
    const zone = await prisma.zone.create({
      data: {
        name: zoneData.name,
        nameAr: zoneData.nameAr,
        code: zoneData.code,
        description: zoneData.description,
      },
    });
    console.log(`  ✅ Created zone: ${zone.name} (ID: ${zone.id})`);

    // Find the governorate
    const governorate = await prisma.governorate.findFirst({
      where: { name: zoneData.governorateName },
    });

    if (!governorate) {
      console.log(`  ⚠️ Governorate "${zoneData.governorateName}" not found, skipping area mapping`);
      continue;
    }

    // Find all areas in this governorate
    const areas = await prisma.area.findMany({
      where: { governorateId: governorate.id },
      orderBy: { name: 'asc' },
    });

    console.log(`  📍 Found ${areas.length} areas in ${zoneData.governorateName}`);

    // Create zone-area mappings
    for (const area of areas) {
      await prisma.zoneArea.create({
        data: {
          zoneId: zone.id,
          areaId: area.id,
        },
      });
    }

    console.log(`  ✅ Mapped ${areas.length} areas to ${zoneData.name}\n`);
  }

  // Summary
  const totalZones = await prisma.zone.count();
  const totalMappings = await prisma.zoneArea.count();

  console.log('\n🎉 Zones seeding completed!');
  console.log(`   📊 Total Zones: ${totalZones}`);
  console.log(`   📊 Total Zone-Area Mappings: ${totalMappings}`);

  // Display summary by zone
  console.log('\n📋 Zone Summary:');
  const zones = await prisma.zone.findMany({
    include: {
      areas: {
        include: {
          area: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  for (const zone of zones) {
    console.log(`   ${zone.name} (${zone.code}): ${zone.areas.length} areas`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
