import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createPermission(resource: string, action: string, description: string) {
  return prisma.permission.upsert({
    where: {
      resource_action: { resource, action },
    },
    update: {},
    create: { resource, action, description },
  });
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create Permissions
  const permissions = await Promise.all([
    // User management
    createPermission('users', 'read', 'View users'),
    createPermission('users', 'write', 'Create/update users'),
    createPermission('users', 'delete', 'Delete users'),
    // Company management
    createPermission('company', 'read', 'View company'),
    createPermission('company', 'write', 'Update company'),
    // Customer management
    createPermission('customers', 'read', 'View customers'),
    createPermission('customers', 'write', 'Create/update customers'),
    createPermission('customers', 'delete', 'Delete customers'),
    // Service requests
    createPermission('service_requests', 'read', 'View service requests'),
    createPermission('service_requests', 'write', 'Create/update service requests'),
    createPermission('service_requests', 'delete', 'Delete service requests'),
    createPermission('service_requests', 'assign', 'Assign service requests'),
    // Employees
    createPermission('employees', 'read', 'View employees'),
    createPermission('employees', 'write', 'Create/update employees'),
    createPermission('employees', 'delete', 'Delete employees'),
    // Invoices
    createPermission('invoices', 'read', 'View invoices'),
    createPermission('invoices', 'write', 'Create/update invoices'),
    createPermission('invoices', 'delete', 'Delete invoices'),
    // Reports
    createPermission('reports', 'read', 'View reports'),
    createPermission('reports', 'export', 'Export reports'),
    // Settings
    createPermission('settings', 'read', 'View settings'),
    createPermission('settings', 'write', 'Update settings'),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      displayName: 'Manager',
      description: 'Team and operations management',
      isSystem: true,
    },
  });

  const technicianRole = await prisma.role.upsert({
    where: { name: 'technician' },
    update: {},
    create: {
      name: 'technician',
      displayName: 'Technician',
      description: 'Field technician with limited access',
      isSystem: true,
    },
  });

  const receptionistRole = await prisma.role.upsert({
    where: { name: 'receptionist' },
    update: {},
    create: {
      name: 'receptionist',
      displayName: 'Receptionist',
      description: 'Front desk and customer service',
      isSystem: true,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: {
      name: 'customer',
      displayName: 'Customer',
      description: 'Customer portal access',
      isSystem: true,
    },
  });

  console.log('✅ Created roles: admin, manager, technician, receptionist, customer');

  // Assign all permissions to admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Helper to find permission by resource and action
  const findPerm = (resource: string, action: string) =>
    allPermissions.find(p => p.resource === resource && p.action === action);

  // Assign manager permissions
  const managerPerms = [
    ['users', 'read'], ['company', 'read'], ['customers', 'read'], ['customers', 'write'],
    ['service_requests', 'read'], ['service_requests', 'write'], ['service_requests', 'assign'],
    ['employees', 'read'], ['employees', 'write'], ['invoices', 'read'], ['invoices', 'write'],
    ['reports', 'read'], ['reports', 'export'], ['settings', 'read'],
  ];
  for (const [resource, action] of managerPerms) {
    const perm = findPerm(resource, action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Assign technician permissions
  const technicianPerms = [
    ['service_requests', 'read'], ['service_requests', 'write'],
    ['customers', 'read'], ['invoices', 'read'],
  ];
  for (const [resource, action] of technicianPerms) {
    const perm = findPerm(resource, action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: technicianRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: technicianRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Assign receptionist permissions
  const receptionistPerms = [
    ['customers', 'read'], ['customers', 'write'],
    ['service_requests', 'read'], ['service_requests', 'write'],
    ['invoices', 'read'],
  ];
  for (const [resource, action] of receptionistPerms) {
    const perm = findPerm(resource, action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: receptionistRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: receptionistRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log('✅ Assigned permissions to roles');

  // Create Complaint Types (Service Categories)
  const complaintTypes = await Promise.all([
    prisma.complaintType.upsert({
      where: { name: 'AC Maintenance' },
      update: {},
      create: {
        name: 'AC Maintenance',
        nameAr: 'صيانة المكيفات',
        description: 'Air conditioning repair and maintenance services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Plumbing' },
      update: {},
      create: {
        name: 'Plumbing',
        nameAr: 'السباكة',
        description: 'Plumbing repair and installation services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Electrical' },
      update: {},
      create: {
        name: 'Electrical',
        nameAr: 'الكهرباء',
        description: 'Electrical repair and installation services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Cleaning' },
      update: {},
      create: {
        name: 'Cleaning',
        nameAr: 'التنظيف',
        description: 'Professional cleaning services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Carpentry' },
      update: {},
      create: {
        name: 'Carpentry',
        nameAr: 'النجارة',
        description: 'Carpentry and woodwork services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Painting' },
      update: {},
      create: {
        name: 'Painting',
        nameAr: 'الدهان',
        description: 'Interior and exterior painting services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'Appliance Repair' },
      update: {},
      create: {
        name: 'Appliance Repair',
        nameAr: 'إصلاح الأجهزة',
        description: 'Home appliance repair services',
      },
    }),
    prisma.complaintType.upsert({
      where: { name: 'General Maintenance' },
      update: {},
      create: {
        name: 'General Maintenance',
        nameAr: 'الصيانة العامة',
        description: 'General handyman and maintenance services',
      },
    }),
  ]);

  console.log(`✅ Created ${complaintTypes.length} complaint types`);

  // Create a demo company
  const demoCompany = await prisma.company.upsert({
    where: { id: 'demo-company-fixitbh' },
    update: {},
    create: {
      id: 'demo-company-fixitbh',
      name: 'FixIt Pro WLL',
      nameAr: 'فيكسإت برو ذ.م.م',
      email: 'info@fixitbh.com',
      phone: '+97317000000',
      website: 'https://fixitbh.agentcareai.com',
      address: '123 Main Street, Manama, Bahrain',
    },
  });

  console.log(`✅ Created demo company: ${demoCompany.name}`);

  // Create a demo admin user
  const hashedPassword = await bcrypt.hash('Admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fixitbh.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@fixitbh.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+97317000001',
      roleId: adminRole.id,
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`✅ Created demo admin user: ${adminUser.email}`);

  // Create an employee record for the admin
  await prisma.employee.upsert({
    where: { email: 'admin@fixitbh.com' },
    update: {},
    create: {
      userId: adminUser.id,
      employeeNo: 'EMP001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@fixitbh.com',
      phone: '+97317000001',
      companyId: demoCompany.id,
      hireDate: new Date(),
      hasSystemAccess: true,
    },
  });

  console.log('✅ Created employee record for admin');

  // Create job titles
  const jobTitles = await Promise.all([
    prisma.jobTitle.upsert({
      where: { name: 'System Administrator' },
      update: {},
      create: { name: 'System Administrator', nameAr: 'مدير النظام' },
    }),
    prisma.jobTitle.upsert({
      where: { name: 'Operations Manager' },
      update: {},
      create: { name: 'Operations Manager', nameAr: 'مدير العمليات' },
    }),
    prisma.jobTitle.upsert({
      where: { name: 'Senior Technician' },
      update: {},
      create: { name: 'Senior Technician', nameAr: 'فني أول' },
    }),
    prisma.jobTitle.upsert({
      where: { name: 'Technician' },
      update: {},
      create: { name: 'Technician', nameAr: 'فني' },
    }),
    prisma.jobTitle.upsert({
      where: { name: 'Receptionist' },
      update: {},
      create: { name: 'Receptionist', nameAr: 'موظف استقبال' },
    }),
  ]);

  console.log(`✅ Created ${jobTitles.length} job titles`);

  // Create Property Types
  const propertyTypes = await Promise.all([
    prisma.propertyType.upsert({
      where: { name: 'Villa' },
      update: {},
      create: { name: 'Villa', nameAr: 'فيلا' },
    }),
    prisma.propertyType.upsert({
      where: { name: 'Apartment' },
      update: {},
      create: { name: 'Apartment', nameAr: 'شقة' },
    }),
    prisma.propertyType.upsert({
      where: { name: 'Office' },
      update: {},
      create: { name: 'Office', nameAr: 'مكتب' },
    }),
    prisma.propertyType.upsert({
      where: { name: 'Commercial Building' },
      update: {},
      create: { name: 'Commercial Building', nameAr: 'مبنى تجاري' },
    }),
    prisma.propertyType.upsert({
      where: { name: 'Warehouse' },
      update: {},
      create: { name: 'Warehouse', nameAr: 'مستودع' },
    }),
  ]);

  console.log(`✅ Created ${propertyTypes.length} property types`);

  // Create Asset Types with categories and icons
  const assetTypes = await Promise.all([
    // HVAC
    prisma.assetType.upsert({
      where: { name: 'Split AC' },
      update: { category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 10 },
      create: { name: 'Split AC', nameAr: 'مكيف سبليت', category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 10 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Central AC' },
      update: { category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 15 },
      create: { name: 'Central AC', nameAr: 'مكيف مركزي', category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 15 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Window AC' },
      update: { category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 8 },
      create: { name: 'Window AC', nameAr: 'مكيف شباك', category: 'HVAC', icon: 'AirVent', defaultServiceIntervalDays: 90, defaultLifeYears: 8 },
    }),
    // PLUMBING
    prisma.assetType.upsert({
      where: { name: 'Water Heater' },
      update: { category: 'PLUMBING', icon: 'Droplets', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Water Heater', nameAr: 'سخان ماء', category: 'PLUMBING', icon: 'Droplets', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Water Pump' },
      update: { category: 'PLUMBING', icon: 'Droplets', defaultServiceIntervalDays: 180, defaultLifeYears: 8 },
      create: { name: 'Water Pump', nameAr: 'مضخة مياه', category: 'PLUMBING', icon: 'Droplets', defaultServiceIntervalDays: 180, defaultLifeYears: 8 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Water Tank' },
      update: { category: 'PLUMBING', icon: 'Container', defaultServiceIntervalDays: 365, defaultLifeYears: 20 },
      create: { name: 'Water Tank', nameAr: 'خزان مياه', category: 'PLUMBING', icon: 'Container', defaultServiceIntervalDays: 365, defaultLifeYears: 20 },
    }),
    // ELECTRICAL
    prisma.assetType.upsert({
      where: { name: 'Electrical Panel' },
      update: { category: 'ELECTRICAL', icon: 'Zap', defaultServiceIntervalDays: 365, defaultLifeYears: 25 },
      create: { name: 'Electrical Panel', nameAr: 'لوحة كهربائية', category: 'ELECTRICAL', icon: 'Zap', defaultServiceIntervalDays: 365, defaultLifeYears: 25 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Generator' },
      update: { category: 'ELECTRICAL', icon: 'Zap', defaultServiceIntervalDays: 180, defaultLifeYears: 15 },
      create: { name: 'Generator', nameAr: 'مولد كهربائي', category: 'ELECTRICAL', icon: 'Zap', defaultServiceIntervalDays: 180, defaultLifeYears: 15 },
    }),
    // APPLIANCES
    prisma.assetType.upsert({
      where: { name: 'Washing Machine' },
      update: { category: 'APPLIANCES', icon: 'WashingMachine', defaultServiceIntervalDays: 365, defaultLifeYears: 8 },
      create: { name: 'Washing Machine', nameAr: 'غسالة ملابس', category: 'APPLIANCES', icon: 'WashingMachine', defaultServiceIntervalDays: 365, defaultLifeYears: 8 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Refrigerator' },
      update: { category: 'APPLIANCES', icon: 'Refrigerator', defaultServiceIntervalDays: 365, defaultLifeYears: 12 },
      create: { name: 'Refrigerator', nameAr: 'ثلاجة', category: 'APPLIANCES', icon: 'Refrigerator', defaultServiceIntervalDays: 365, defaultLifeYears: 12 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Dishwasher' },
      update: { category: 'APPLIANCES', icon: 'Utensils', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Dishwasher', nameAr: 'غسالة صحون', category: 'APPLIANCES', icon: 'Utensils', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Oven' },
      update: { category: 'APPLIANCES', icon: 'ChefHat', defaultServiceIntervalDays: 365, defaultLifeYears: 15 },
      create: { name: 'Oven', nameAr: 'فرن', category: 'APPLIANCES', icon: 'ChefHat', defaultServiceIntervalDays: 365, defaultLifeYears: 15 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Cooktop' },
      update: { category: 'APPLIANCES', icon: 'Flame', defaultServiceIntervalDays: 365, defaultLifeYears: 12 },
      create: { name: 'Cooktop', nameAr: 'بوتاجاز', category: 'APPLIANCES', icon: 'Flame', defaultServiceIntervalDays: 365, defaultLifeYears: 12 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Dryer' },
      update: { category: 'APPLIANCES', icon: 'Wind', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Dryer', nameAr: 'مجفف ملابس', category: 'APPLIANCES', icon: 'Wind', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    // SECURITY
    prisma.assetType.upsert({
      where: { name: 'CCTV Camera' },
      update: { category: 'SECURITY', icon: 'Camera', defaultServiceIntervalDays: 180, defaultLifeYears: 5 },
      create: { name: 'CCTV Camera', nameAr: 'كاميرا مراقبة', category: 'SECURITY', icon: 'Camera', defaultServiceIntervalDays: 180, defaultLifeYears: 5 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Access Control' },
      update: { category: 'SECURITY', icon: 'KeyRound', defaultServiceIntervalDays: 180, defaultLifeYears: 8 },
      create: { name: 'Access Control', nameAr: 'نظام التحكم بالدخول', category: 'SECURITY', icon: 'KeyRound', defaultServiceIntervalDays: 180, defaultLifeYears: 8 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Intercom' },
      update: { category: 'SECURITY', icon: 'Phone', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Intercom', nameAr: 'انتركم', category: 'SECURITY', icon: 'Phone', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    // FIRE_SAFETY
    prisma.assetType.upsert({
      where: { name: 'Fire Extinguisher' },
      update: { category: 'FIRE_SAFETY', icon: 'FireExtinguisher', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Fire Extinguisher', nameAr: 'طفاية حريق', category: 'FIRE_SAFETY', icon: 'FireExtinguisher', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Smoke Detector' },
      update: { category: 'FIRE_SAFETY', icon: 'AlertTriangle', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
      create: { name: 'Smoke Detector', nameAr: 'كاشف دخان', category: 'FIRE_SAFETY', icon: 'AlertTriangle', defaultServiceIntervalDays: 365, defaultLifeYears: 10 },
    }),
    // ELEVATOR
    prisma.assetType.upsert({
      where: { name: 'Passenger Elevator' },
      update: { category: 'ELEVATOR', icon: 'ArrowUpDown', defaultServiceIntervalDays: 30, defaultLifeYears: 20 },
      create: { name: 'Passenger Elevator', nameAr: 'مصعد ركاب', category: 'ELEVATOR', icon: 'ArrowUpDown', defaultServiceIntervalDays: 30, defaultLifeYears: 20 },
    }),
    // FURNITURE
    prisma.assetType.upsert({
      where: { name: 'Sofa' },
      update: { category: 'FURNITURE', icon: 'Sofa', defaultLifeYears: 10 },
      create: { name: 'Sofa', nameAr: 'كنبة', category: 'FURNITURE', icon: 'Sofa', defaultLifeYears: 10 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Bed' },
      update: { category: 'FURNITURE', icon: 'Bed', defaultLifeYears: 15 },
      create: { name: 'Bed', nameAr: 'سرير', category: 'FURNITURE', icon: 'Bed', defaultLifeYears: 15 },
    }),
    prisma.assetType.upsert({
      where: { name: 'Wardrobe' },
      update: { category: 'FURNITURE', icon: 'Archive', defaultLifeYears: 20 },
      create: { name: 'Wardrobe', nameAr: 'خزانة ملابس', category: 'FURNITURE', icon: 'Archive', defaultLifeYears: 20 },
    }),
    // ENTERTAINMENT
    prisma.assetType.upsert({
      where: { name: 'Television' },
      update: { category: 'ENTERTAINMENT', icon: 'Tv', defaultLifeYears: 7 },
      create: { name: 'Television', nameAr: 'تلفزيون', category: 'ENTERTAINMENT', icon: 'Tv', defaultLifeYears: 7 },
    }),
  ]);

  console.log(`✅ Created ${assetTypes.length} asset types`);

  // Create Location Hierarchy: Country > State > District > Governorate > Zone
  const bahrain = await prisma.country.upsert({
    where: { code: 'BH' },
    update: {},
    create: {
      name: 'Bahrain',
      nameAr: 'البحرين',
      code: 'BH',
    },
  });

  const bahrainState = await prisma.state.upsert({
    where: {
      countryId_name: {
        countryId: bahrain.id,
        name: 'Capital Governorate',
      },
    },
    update: {},
    create: {
      countryId: bahrain.id,
      name: 'Capital Governorate',
      nameAr: 'محافظة العاصمة',
      code: 'BH-13',
    },
  });

  const manamaDistrict = await prisma.district.upsert({
    where: {
      stateId_name: {
        stateId: bahrainState.id,
        name: 'Manama',
      },
    },
    update: {},
    create: {
      stateId: bahrainState.id,
      name: 'Manama',
      nameAr: 'المنامة',
      code: 'MANAMA',
    },
  });

  const juffairGov = await prisma.governorate.upsert({
    where: {
      districtId_name: {
        districtId: manamaDistrict.id,
        name: 'Juffair',
      },
    },
    update: {},
    create: {
      districtId: manamaDistrict.id,
      name: 'Juffair',
      nameAr: 'الجفير',
      code: 'JUFFAIR',
    },
  });

  const seefGov = await prisma.governorate.upsert({
    where: {
      districtId_name: {
        districtId: manamaDistrict.id,
        name: 'Seef',
      },
    },
    update: {},
    create: {
      districtId: manamaDistrict.id,
      name: 'Seef',
      nameAr: 'السيف',
      code: 'SEEF',
    },
  });

  console.log('✅ Created location hierarchy: Bahrain > Capital > Manama > Juffair, Seef');

  // Create Zones
  const juffairZone = await prisma.zone.upsert({
    where: { code: 'ZONE-JUF' },
    update: {},
    create: {
      governorateId: juffairGov.id,
      name: 'Juffair Zone',
      nameAr: 'منطقة الجفير',
      code: 'ZONE-JUF',
    },
  });

  const seefZone = await prisma.zone.upsert({
    where: { code: 'ZONE-SEEF' },
    update: {},
    create: {
      governorateId: seefGov.id,
      name: 'Seef Zone',
      nameAr: 'منطقة السيف',
      code: 'ZONE-SEEF',
    },
  });

  console.log('✅ Created zones: Juffair Zone, Seef Zone');

  // Create Demo Properties
  const villa = propertyTypes.find(pt => pt.name === 'Villa');
  const apartment = propertyTypes.find(pt => pt.name === 'Apartment');

  const demoProperty1 = await prisma.property.upsert({
    where: { id: 'demo-property-1' },
    update: {},
    create: {
      id: 'demo-property-1',
      propertyNo: 'PROP-001',
      typeId: villa!.id,
      zoneId: juffairZone.id,
      name: 'Al Juffair Villa 101',
      nameAr: 'فيلا الجفير 101',
      address: 'Building 101, Road 1234, Block 123, Juffair',
      building: '101',
    },
  });

  const demoProperty2 = await prisma.property.upsert({
    where: { id: 'demo-property-2' },
    update: {},
    create: {
      id: 'demo-property-2',
      propertyNo: 'PROP-002',
      typeId: apartment!.id,
      zoneId: seefZone.id,
      name: 'Seef Tower Apt 501',
      nameAr: 'شقة برج السيف 501',
      address: 'Seef Tower, Block 428, Seef',
      building: '1501',
      floor: '5',
      unit: '501',
    },
  });

  console.log('✅ Created demo properties');

  // Create a demo customer with property
  const demoCustomer = await prisma.customer.upsert({
    where: { email: 'demo.customer@example.com' },
    update: {},
    create: {
      customerNo: 'CUS-DEMO-001',
      customerType: 'INDIVIDUAL',
      firstName: 'Mohammed',
      lastName: 'Ali',
      firstNameAr: 'محمد',
      lastNameAr: 'علي',
      email: 'demo.customer@example.com',
      phone: '+97333123456',
      isActive: true,
      isVerified: true,
    },
  });

  // Link customer to properties
  await prisma.customerProperty.upsert({
    where: {
      customerId_propertyId: {
        customerId: demoCustomer.id,
        propertyId: demoProperty1.id,
      },
    },
    update: {},
    create: {
      customerId: demoCustomer.id,
      propertyId: demoProperty1.id,
      ownershipType: 'OWNER',
      isPrimary: true,
    },
  });

  console.log('✅ Created demo customer with property');

  // Create a demo service request
  const plumbingType = complaintTypes.find(ct => ct.name === 'Plumbing');
  const adminEmployee = await prisma.employee.findFirst({
    where: { email: 'admin@fixitbh.com' },
  });

  if (plumbingType) {
    await prisma.serviceRequest.upsert({
      where: { id: 'demo-sr-001' },
      update: {},
      create: {
        id: 'demo-sr-001',
        requestNo: 'SR-DEMO-001',
        customerId: demoCustomer.id,
        propertyId: demoProperty1.id,
        zoneId: juffairZone.id,
        complaintTypeId: plumbingType.id,
        requestType: 'ON_CALL',
        priority: 'MEDIUM',
        title: 'Leaking faucet in kitchen',
        customerNotes: 'The kitchen faucet has been leaking for 2 days. Water pressure seems low.',
        status: 'NEW',
        source: 'PHONE',
      },
    });

    console.log('✅ Created demo service request');
  }

  // Create Leave Types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { name: 'Annual Leave' },
      update: {},
      create: {
        name: 'Annual Leave',
        nameAr: 'إجازة سنوية',
        description: 'Standard annual vacation leave',
        defaultDays: 21,
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 14,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Sick Leave' },
      update: {},
      create: {
        name: 'Sick Leave',
        nameAr: 'إجازة مرضية',
        description: 'Medical or health-related leave',
        defaultDays: 15,
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 7,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Emergency Leave' },
      update: {},
      create: {
        name: 'Emergency Leave',
        nameAr: 'إجازة طارئة',
        description: 'Leave for urgent personal matters',
        defaultDays: 3,
        isPaid: true,
        requiresApproval: false,
        maxConsecutiveDays: 3,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Maternity Leave' },
      update: {},
      create: {
        name: 'Maternity Leave',
        nameAr: 'إجازة أمومة',
        description: 'Leave for expecting mothers',
        defaultDays: 60,
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 60,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Paternity Leave' },
      update: {},
      create: {
        name: 'Paternity Leave',
        nameAr: 'إجازة أبوة',
        description: 'Leave for new fathers',
        defaultDays: 3,
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 3,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Unpaid Leave' },
      update: {},
      create: {
        name: 'Unpaid Leave',
        nameAr: 'إجازة بدون راتب',
        description: 'Leave without pay',
        defaultDays: 0,
        isPaid: false,
        requiresApproval: true,
        maxConsecutiveDays: 30,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Hajj Leave' },
      update: {},
      create: {
        name: 'Hajj Leave',
        nameAr: 'إجازة حج',
        description: 'Leave for Hajj pilgrimage (once in employment)',
        defaultDays: 15,
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 15,
      },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Bereavement Leave' },
      update: {},
      create: {
        name: 'Bereavement Leave',
        nameAr: 'إجازة عزاء',
        description: 'Leave for death of a family member',
        defaultDays: 3,
        isPaid: true,
        requiresApproval: false,
        maxConsecutiveDays: 7,
      },
    }),
  ]);

  console.log(`✅ Created ${leaveTypes.length} leave types`);

  // Create Menu Items
  const menuItems = await Promise.all([
    prisma.menuItem.upsert({
      where: { key: 'dashboard' },
      update: {},
      create: {
        key: 'dashboard',
        name: 'Dashboard',
        nameAr: 'لوحة التحكم',
        icon: 'dashboard',
        href: '/dashboard',
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'requests' },
      update: {},
      create: {
        key: 'requests',
        name: 'Service Requests',
        nameAr: 'طلبات الخدمة',
        icon: 'requests',
        href: '/requests',
        sortOrder: 2,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'customers' },
      update: {},
      create: {
        key: 'customers',
        name: 'Customers',
        nameAr: 'العملاء',
        icon: 'customers',
        href: '/customers',
        sortOrder: 3,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'properties' },
      update: {},
      create: {
        key: 'properties',
        name: 'Properties',
        nameAr: 'العقارات',
        icon: 'properties',
        href: '/properties',
        sortOrder: 4,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'amc' },
      update: {},
      create: {
        key: 'amc',
        name: 'AMC Contracts',
        nameAr: 'عقود الصيانة',
        icon: 'amc',
        href: '/amc',
        sortOrder: 5,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'employees' },
      update: {},
      create: {
        key: 'employees',
        name: 'Employees',
        nameAr: 'الموظفون',
        icon: 'employees',
        href: '/employees',
        sortOrder: 6,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'leaves' },
      update: {},
      create: {
        key: 'leaves',
        name: 'Leave Management',
        nameAr: 'إدارة الإجازات',
        icon: 'calendar',
        href: '/leaves',
        sortOrder: 7,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'invoices' },
      update: {},
      create: {
        key: 'invoices',
        name: 'Invoices',
        nameAr: 'الفواتير',
        icon: 'invoices',
        href: '/invoices',
        sortOrder: 8,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'quotes' },
      update: {},
      create: {
        key: 'quotes',
        name: 'Quotes',
        nameAr: 'عروض الأسعار',
        icon: 'quotes',
        href: '/quotes',
        sortOrder: 9,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'receipts' },
      update: {},
      create: {
        key: 'receipts',
        name: 'Receipts',
        nameAr: 'الإيصالات',
        icon: 'receipts',
        href: '/receipts',
        sortOrder: 10,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'email-templates' },
      update: {},
      create: {
        key: 'email-templates',
        name: 'Email Templates',
        nameAr: 'قوالب البريد',
        icon: 'email',
        href: '/email-templates',
        sortOrder: 11,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'reports' },
      update: {},
      create: {
        key: 'reports',
        name: 'Reports',
        nameAr: 'التقارير',
        icon: 'reports',
        href: '/reports',
        sortOrder: 12,
      },
    }),
    prisma.menuItem.upsert({
      where: { key: 'settings' },
      update: {},
      create: {
        key: 'settings',
        name: 'Settings',
        nameAr: 'الإعدادات',
        icon: 'settings',
        href: '/settings',
        sortOrder: 13,
      },
    }),
  ]);

  console.log(`✅ Created ${menuItems.length} menu items`);

  // Assign all menus to admin role
  const allMenuItems = await prisma.menuItem.findMany();
  for (const menu of allMenuItems) {
    await prisma.roleMenuPermission.upsert({
      where: {
        roleId_menuItemId: {
          roleId: adminRole.id,
          menuItemId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        menuItemId: menu.id,
      },
    });
  }
  console.log('✅ Assigned all menus to admin role');

  // Assign menus to manager role (all except settings)
  const managerMenuKeys = ['dashboard', 'requests', 'customers', 'properties', 'amc', 'employees', 'leaves', 'invoices', 'reports'];
  for (const key of managerMenuKeys) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: {
          roleId_menuItemId: {
            roleId: managerRole.id,
            menuItemId: menu.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          menuItemId: menu.id,
        },
      });
    }
  }
  console.log('✅ Assigned menus to manager role');

  // Assign only Service Requests menu to technician role
  const technicianMenuKeys = ['requests'];
  for (const key of technicianMenuKeys) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: {
          roleId_menuItemId: {
            roleId: technicianRole.id,
            menuItemId: menu.id,
          },
        },
        update: {},
        create: {
          roleId: technicianRole.id,
          menuItemId: menu.id,
        },
      });
    }
  }
  console.log('✅ Assigned Service Requests menu to technician role (zone-specific access)');

  // Assign menus to receptionist role
  const receptionistMenuKeys = ['dashboard', 'requests', 'customers', 'invoices'];
  for (const key of receptionistMenuKeys) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: {
          roleId_menuItemId: {
            roleId: receptionistRole.id,
            menuItemId: menu.id,
          },
        },
        update: {},
        create: {
          roleId: receptionistRole.id,
          menuItemId: menu.id,
        },
      });
    }
  }
  console.log('✅ Assigned menus to receptionist role');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: admin@fixitbh.com');
  console.log('   Password: Admin123');
  console.log('   Company: FixIt Pro WLL');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
