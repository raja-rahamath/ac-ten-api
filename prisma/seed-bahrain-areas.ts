import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bahrain Governorates and their Areas
const bahrainData = {
  governorates: [
    {
      name: 'Capital Governorate',
      nameAr: 'محافظة العاصمة',
      code: 'CAPITAL',
      areas: [
        { name: 'Manama', nameAr: 'المنامة', code: 'MANAMA' },
        { name: 'Diplomatic Area', nameAr: 'المنطقة الدبلوماسية', code: 'DIPLOMATIC' },
        { name: 'Juffair', nameAr: 'الجفير', code: 'JUFFAIR' },
        { name: 'Hoora', nameAr: 'الحورة', code: 'HOORA' },
        { name: 'Adliya', nameAr: 'العدلية', code: 'ADLIYA' },
        { name: 'Gudaibiya', nameAr: 'القضيبية', code: 'GUDAIBIYA' },
        { name: 'Seef', nameAr: 'السيف', code: 'SEEF' },
        { name: 'Sanabis', nameAr: 'سنابس', code: 'SANABIS' },
        { name: 'Zinj', nameAr: 'الزنج', code: 'ZINJ' },
        { name: 'Um Al Hassam', nameAr: 'أم الحصم', code: 'UM_AL_HASSAM' },
        { name: 'Mahooz', nameAr: 'الماحوز', code: 'MAHOOZ' },
        { name: 'Salmaniya', nameAr: 'السلمانية', code: 'SALMANIYA' },
        { name: 'Naim', nameAr: 'النعيم', code: 'NAIM' },
        { name: 'Qudaibiya', nameAr: 'القضيبية', code: 'QUDAIBIYA' },
        { name: 'Suqaya', nameAr: 'السقية', code: 'SUQAYA' },
        { name: 'Ras Romman', nameAr: 'رأس رمان', code: 'RAS_ROMMAN' },
      ],
    },
    {
      name: 'Muharraq Governorate',
      nameAr: 'محافظة المحرق',
      code: 'MUHARRAQ',
      areas: [
        { name: 'Muharraq', nameAr: 'المحرق', code: 'MUHARRAQ' },
        { name: 'Busaiteen', nameAr: 'البسيتين', code: 'BUSAITEEN' },
        { name: 'Hidd', nameAr: 'الحد', code: 'HIDD' },
        { name: 'Arad', nameAr: 'عراد', code: 'ARAD' },
        { name: 'Galali', nameAr: 'قلالي', code: 'GALALI' },
        { name: 'Samaheej', nameAr: 'سماهيج', code: 'SAMAHEEJ' },
        { name: 'Dair', nameAr: 'الدير', code: 'DAIR' },
        { name: 'Amwaj Islands', nameAr: 'جزر أمواج', code: 'AMWAJ' },
        { name: 'Halat Nuaim', nameAr: 'حالة النعيم', code: 'HALAT_NUAIM' },
        { name: 'Halat Bu Maher', nameAr: 'حالة بو ماهر', code: 'HALAT_BU_MAHER' },
        { name: 'Halat Seltah', nameAr: 'حالة السلطة', code: 'HALAT_SELTAH' },
        { name: 'Freej Al Olas', nameAr: 'فريج العولص', code: 'FREEJ_AL_OLAS' },
      ],
    },
    {
      name: 'Northern Governorate',
      nameAr: 'المحافظة الشمالية',
      code: 'NORTHERN',
      areas: [
        { name: 'Budaiya', nameAr: 'البديع', code: 'BUDAIYA' },
        { name: 'Diraz', nameAr: 'دراز', code: 'DIRAZ' },
        { name: 'Barbar', nameAr: 'باربار', code: 'BARBAR' },
        { name: 'Bani Jamra', nameAr: 'بني جمرة', code: 'BANI_JAMRA' },
        { name: 'Karzakan', nameAr: 'كرزكان', code: 'KARZAKAN' },
        { name: 'Malkiya', nameAr: 'المالكية', code: 'MALKIYA' },
        { name: 'Dumistan', nameAr: 'دمستان', code: 'DUMISTAN' },
        { name: 'Janabiya', nameAr: 'الجنبية', code: 'JANABIYA' },
        { name: 'Saar', nameAr: 'سار', code: 'SAAR' },
        { name: 'Jasra', nameAr: 'جسرة', code: 'JASRA' },
        { name: 'Hamad Town', nameAr: 'مدينة حمد', code: 'HAMAD_TOWN' },
        { name: 'Abu Saiba', nameAr: 'أبو صيبع', code: 'ABU_SAIBA' },
        { name: 'Shakhoora', nameAr: 'الشاخورة', code: 'SHAKHOORA' },
        { name: 'Khamis', nameAr: 'الخميس', code: 'KHAMIS' },
        { name: 'Al Markh', nameAr: 'المرخ', code: 'AL_MARKH' },
        { name: 'Buri', nameAr: 'بوري', code: 'BURI' },
        { name: 'Qadam', nameAr: 'قدم', code: 'QADAM' },
        { name: 'Salmabad', nameAr: 'سلماباد', code: 'SALMABAD' },
        { name: 'Karranah', nameAr: 'كرانة', code: 'KARRANAH' },
        { name: 'Tubli', nameAr: 'توبلي', code: 'TUBLI' },
      ],
    },
    {
      name: 'Southern Governorate',
      nameAr: 'المحافظة الجنوبية',
      code: 'SOUTHERN',
      areas: [
        { name: 'Riffa', nameAr: 'الرفاع', code: 'RIFFA' },
        { name: 'East Riffa', nameAr: 'الرفاع الشرقي', code: 'EAST_RIFFA' },
        { name: 'West Riffa', nameAr: 'الرفاع الغربي', code: 'WEST_RIFFA' },
        { name: 'Isa Town', nameAr: 'مدينة عيسى', code: 'ISA_TOWN' },
        { name: 'Zallaq', nameAr: 'الزلاق', code: 'ZALLAQ' },
        { name: 'Sakhir', nameAr: 'الصخير', code: 'SAKHIR' },
        { name: 'Awali', nameAr: 'عوالي', code: 'AWALI' },
        { name: 'Askar', nameAr: 'عسكر', code: 'ASKAR' },
        { name: 'Jaw', nameAr: 'جو', code: 'JAW' },
        { name: 'Durrat Al Bahrain', nameAr: 'درة البحرين', code: 'DURRAT' },
        { name: 'Hawar Islands', nameAr: 'جزر حوار', code: 'HAWAR' },
        { name: 'Al Aker', nameAr: 'العكر', code: 'AL_AKER' },
        { name: 'Jidhafs', nameAr: 'جدحفص', code: 'JIDHAFS' },
        { name: 'Nuwaidrat', nameAr: 'النويدرات', code: 'NUWAIDRAT' },
      ],
    },
  ],
};

async function main() {
  console.log('🌱 Seeding Bahrain Governorates and Areas...\n');

  // Step 1: Find the district (Manama) to link governorates to
  // First, find Bahrain country
  let bahrain = await prisma.country.findFirst({
    where: { code: 'BH' },
  });

  if (!bahrain) {
    console.log('Creating Bahrain country...');
    bahrain = await prisma.country.create({
      data: {
        name: 'Bahrain',
        nameAr: 'البحرين',
        code: 'BH',
      },
    });
  }
  console.log(`✅ Bahrain country: ${bahrain.id}`);

  // Find or create state for Bahrain (Bahrain is a small country, we'll use "Kingdom of Bahrain" as state)
  let bahrainState = await prisma.state.findFirst({
    where: { countryId: bahrain.id },
  });

  if (!bahrainState) {
    console.log('Creating Kingdom of Bahrain state...');
    bahrainState = await prisma.state.create({
      data: {
        countryId: bahrain.id,
        name: 'Kingdom of Bahrain',
        nameAr: 'مملكة البحرين',
        code: 'BH-00',
      },
    });
  }
  console.log(`✅ Bahrain state: ${bahrainState.id}`);

  // Find or create district for Bahrain
  let bahrainDistrict = await prisma.district.findFirst({
    where: { stateId: bahrainState.id },
  });

  if (!bahrainDistrict) {
    console.log('Creating Bahrain district...');
    bahrainDistrict = await prisma.district.create({
      data: {
        stateId: bahrainState.id,
        name: 'Bahrain',
        nameAr: 'البحرين',
        code: 'BH-MAIN',
      },
    });
  }
  console.log(`✅ Bahrain district: ${bahrainDistrict.id}`);

  // Step 2: Delete existing areas and governorates
  console.log('\n📛 Deleting existing areas and governorates...');

  // Delete zone-area links first (if table exists)
  try {
    const deletedZoneAreas = await prisma.zoneArea.deleteMany({});
    console.log(`  Deleted ${deletedZoneAreas.count} zone-area links`);
  } catch (e) {
    console.log('  ZoneArea table does not exist yet, skipping...');
  }

  // Delete areas
  try {
    const deletedAreas = await prisma.area.deleteMany({});
    console.log(`  Deleted ${deletedAreas.count} areas`);
  } catch (e) {
    console.log('  Areas table does not exist yet, skipping...');
  }

  // Delete governorates
  try {
    const deletedGovernorates = await prisma.governorate.deleteMany({});
    console.log(`  Deleted ${deletedGovernorates.count} governorates`);
  } catch (e) {
    console.log('  Governorates table does not exist yet, skipping...');
  }

  // Step 3: Create new governorates and areas
  console.log('\n🏛️ Creating Bahrain governorates and areas...\n');

  for (const govData of bahrainData.governorates) {
    console.log(`Creating governorate: ${govData.name} (${govData.nameAr})`);

    const governorate = await prisma.governorate.create({
      data: {
        districtId: bahrainDistrict.id,
        name: govData.name,
        nameAr: govData.nameAr,
        code: govData.code,
      },
    });

    console.log(`  ✅ Created governorate: ${governorate.name} (ID: ${governorate.id})`);

    // Create areas for this governorate
    for (const areaData of govData.areas) {
      const area = await prisma.area.create({
        data: {
          governorateId: governorate.id,
          name: areaData.name,
          nameAr: areaData.nameAr,
          code: areaData.code,
        },
      });
      console.log(`    📍 Created area: ${area.name} (${area.nameAr})`);
    }

    console.log(`  ✅ Created ${govData.areas.length} areas for ${govData.name}\n`);
  }

  // Summary
  const totalGovernorates = await prisma.governorate.count();
  const totalAreas = await prisma.area.count();

  console.log('\n🎉 Bahrain seeding completed!');
  console.log(`   📊 Total Governorates: ${totalGovernorates}`);
  console.log(`   📊 Total Areas: ${totalAreas}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
