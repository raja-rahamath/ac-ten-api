import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Employee Organization Structure Seed
 *
 * UPDATED REQUIREMENTS:
 * - CEO and GM: Administrator Role (Bahraini)
 * - 2 Receptionists: Filipino and Arabic females (Customers, Properties, Service Requests access)
 * - 6 Technical Department Managers: Mix of Indian, Pakistani, Bahraini
 * - HR Department (3 people):
 *   - HR Manager: Full organization management
 *   - HR Assistant: View employees, manage leaves
 *   - HR Coordinator
 * - IT Department (3 people):
 *   - IT Manager: Admin users, roles, menus
 *   - IT Infrastructure
 *   - App Support / General Support
 * - Technical Heads: Indian, Pakistani, Bangladeshi
 * - Helpers: Mix of Indian, Sri Lankan, Bangladeshi
 */

// ============================================
// NATIONALITY-BASED NAME POOLS
// ============================================

const BAHRAINI_MALE_NAMES = {
  first: ['Khalid', 'Hamad', 'Salman', 'Rashid', 'Faisal', 'Sultan', 'Abdulla', 'Mohammed'],
  last: ['Al-Khalifa', 'Al-Dosari', 'Al-Mannai', 'Al-Zayani', 'Al-Moayed', 'Al-Kooheji', 'Al-Shirawi', 'Al-Hashimi'],
  firstAr: { 'Khalid': 'خالد', 'Hamad': 'حمد', 'Salman': 'سلمان', 'Rashid': 'راشد', 'Faisal': 'فيصل', 'Sultan': 'سلطان', 'Abdulla': 'عبدالله', 'Mohammed': 'محمد' },
  lastAr: { 'Al-Khalifa': 'آل خليفة', 'Al-Dosari': 'الدوسري', 'Al-Mannai': 'المناعي', 'Al-Zayani': 'الزياني', 'Al-Moayed': 'المؤيد', 'Al-Kooheji': 'كوهجي', 'Al-Shirawi': 'الشيراوي', 'Al-Hashimi': 'الهاشمي' },
};

const BRITISH_MALE_NAMES = {
  first: ['James', 'William', 'Oliver', 'George', 'Thomas'],
  last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Wilson'],
};

const INDIAN_MALE_NAMES = {
  first: ['Rajesh', 'Suresh', 'Vijay', 'Anil', 'Sanjay', 'Ravi', 'Deepak', 'Amit', 'Rakesh', 'Manoj'],
  last: ['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Gupta', 'Nair', 'Menon', 'Pillai', 'Das'],
};

const PAKISTANI_MALE_NAMES = {
  first: ['Ahmed', 'Imran', 'Farhan', 'Bilal', 'Usman', 'Zain', 'Hassan', 'Ali', 'Faisal', 'Kashif'],
  last: ['Khan', 'Malik', 'Iqbal', 'Hussain', 'Raza', 'Sheikh', 'Chaudhry', 'Qureshi', 'Butt', 'Mirza'],
};

const BANGLADESHI_MALE_NAMES = {
  first: ['Rahman', 'Karim', 'Hossain', 'Alam', 'Islam', 'Uddin', 'Miah', 'Chowdhury', 'Sarkar', 'Ahmed'],
  last: ['Rahman', 'Hossain', 'Islam', 'Khan', 'Ahmed', 'Uddin', 'Miah', 'Alam', 'Chowdhury', 'Sarkar'],
};

const SRI_LANKAN_MALE_NAMES = {
  first: ['Chaminda', 'Dinesh', 'Lasith', 'Nuwan', 'Prasanna', 'Tharanga', 'Mahela', 'Kumar'],
  last: ['Perera', 'Fernando', 'Silva', 'Jayawardena', 'Mendis', 'Karunaratne', 'Bandara', 'Wijesinghe'],
};

const FILIPINO_FEMALE_NAMES = {
  first: ['Maria', 'Ana', 'Rose', 'Grace', 'Joy', 'Cherry', 'Michelle', 'Jennifer'],
  last: ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Gonzales', 'Fernandez', 'Lopez', 'Martinez'],
};

const ARABIC_FEMALE_NAMES = {
  first: ['Fatima', 'Aisha', 'Mariam', 'Zainab', 'Noura', 'Huda', 'Layla', 'Sara'],
  last: ['Al-Sayed', 'Al-Jaber', 'Al-Awadhi', 'Al-Qassim', 'Al-Ansari', 'Al-Nuaimi'],
  firstAr: { 'Fatima': 'فاطمة', 'Aisha': 'عائشة', 'Mariam': 'مريم', 'Zainab': 'زينب', 'Noura': 'نورة', 'Huda': 'هدى', 'Layla': 'ليلى', 'Sara': 'سارة' },
  lastAr: { 'Al-Sayed': 'السيد', 'Al-Jaber': 'الجابر', 'Al-Awadhi': 'العوضي', 'Al-Qassim': 'القاسم', 'Al-Ansari': 'الأنصاري', 'Al-Nuaimi': 'النعيمي' },
};

// Track used names to avoid duplicates
let employeeCounter = 2; // Start from 2 since EMP001 is admin
const usedEmails = new Set<string>();
const nameCounters: Record<string, number> = {};

function getNextEmployeeNo(): string {
  return `EMP${String(employeeCounter++).padStart(3, '0')}`;
}

function getNameFromPool(pool: { first: string[]; last: string[] }, key: string): { firstName: string; lastName: string } {
  if (!nameCounters[key]) nameCounters[key] = 0;
  const firstIndex = nameCounters[key] % pool.first.length;
  const lastIndex = Math.floor(nameCounters[key] / pool.first.length) % pool.last.length;
  nameCounters[key]++;
  return {
    firstName: pool.first[firstIndex],
    lastName: pool.last[lastIndex],
  };
}

function generateUniqueEmail(firstName: string, lastName: string): string {
  let baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/al-/i, '').replace(/\s+/g, '')}@fixitbh.com`;
  let email = baseEmail;
  let counter = 1;
  while (usedEmails.has(email)) {
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/al-/i, '').replace(/\s+/g, '')}${counter}@fixitbh.com`;
    counter++;
  }
  usedEmails.add(email);
  return email;
}

function generatePhone(): string {
  const prefix = Math.random() > 0.5 ? '33' : '36';
  const number = Math.floor(Math.random() * 900000) + 100000;
  return `+973${prefix}${number}`;
}

function generateNationalId(): string {
  const year = Math.floor(Math.random() * 30) + 70;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `${year}${month}${seq}`;
}

function getRandomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🧹 Cleaning existing employee data...\n');

  // Delete in correct order to respect foreign keys
  await prisma.employeeZone.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});

  // Delete employees (except admin)
  await prisma.employee.deleteMany({
    where: { email: { not: 'admin@fixitbh.com' } }
  });

  // Delete users created by employee seed (not admin or product admin)
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: ['admin@fixitbh.com', 'prdadmin@agentcare.com']
      }
    }
  });

  // Delete divisions and departments
  await prisma.department.deleteMany({});
  await prisma.division.deleteMany({});

  console.log('✅ Cleaned existing employee data\n');
  console.log('🏢 Seeding Employee Organization Structure...\n');

  const hashedPassword = await bcrypt.hash('Employee123', 10);

  // Get required references
  const company = await prisma.company.findFirst({ where: { id: 'demo-company-fixitbh' } });
  if (!company) {
    throw new Error('Demo company not found. Run main seed first.');
  }

  // Get roles
  const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  const managerRole = await prisma.role.findFirst({ where: { name: 'manager' } });
  const technicianRole = await prisma.role.findFirst({ where: { name: 'technician' } });
  const receptionistRole = await prisma.role.findFirst({ where: { name: 'receptionist' } });

  if (!adminRole || !managerRole || !technicianRole || !receptionistRole) {
    throw new Error('Required roles not found. Run main seed first.');
  }

  // Create new roles for HR and IT
  const hrManagerRole = await prisma.role.upsert({
    where: { name: 'hr_manager' },
    update: {},
    create: {
      name: 'hr_manager',
      displayName: 'HR Manager',
      description: 'Full organization management including employees, leaves, and HR operations',
      isSystem: false,
    },
  });

  const hrAssistantRole = await prisma.role.upsert({
    where: { name: 'hr_assistant' },
    update: {},
    create: {
      name: 'hr_assistant',
      displayName: 'HR Assistant',
      description: 'View employees and manage leaves',
      isSystem: false,
    },
  });

  const itManagerRole = await prisma.role.upsert({
    where: { name: 'it_manager' },
    update: {},
    create: {
      name: 'it_manager',
      displayName: 'IT Manager',
      description: 'Administration of users, roles, and menu assignments',
      isSystem: false,
    },
  });

  const itSupportRole = await prisma.role.upsert({
    where: { name: 'it_support' },
    update: {},
    create: {
      name: 'it_support',
      displayName: 'IT Support',
      description: 'Technical support and infrastructure management',
      isSystem: false,
    },
  });

  console.log('✅ Created/updated HR and IT roles\n');

  // Assign permissions to new roles
  const allPermissions = await prisma.permission.findMany();
  const allMenuItems = await prisma.menuItem.findMany();

  // HR Manager - Full employees, leaves access
  const hrManagerPerms = [
    ['employees', 'read'], ['employees', 'write'], ['employees', 'delete'],
    ['users', 'read'], ['company', 'read'], ['reports', 'read'], ['reports', 'export'],
  ];
  for (const [resource, action] of hrManagerPerms) {
    const perm = allPermissions.find(p => p.resource === resource && p.action === action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: hrManagerRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: hrManagerRole.id, permissionId: perm.id },
      });
    }
  }

  // HR Manager menus
  const hrManagerMenus = ['dashboard', 'employees', 'leaves', 'reports'];
  for (const key of hrManagerMenus) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: { roleId_menuItemId: { roleId: hrManagerRole.id, menuItemId: menu.id } },
        update: {},
        create: { roleId: hrManagerRole.id, menuItemId: menu.id },
      });
    }
  }

  // HR Assistant - View employees, manage leaves
  const hrAssistantPerms = [
    ['employees', 'read'], ['users', 'read'],
  ];
  for (const [resource, action] of hrAssistantPerms) {
    const perm = allPermissions.find(p => p.resource === resource && p.action === action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: hrAssistantRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: hrAssistantRole.id, permissionId: perm.id },
      });
    }
  }

  // HR Assistant menus
  const hrAssistantMenus = ['dashboard', 'employees', 'leaves'];
  for (const key of hrAssistantMenus) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: { roleId_menuItemId: { roleId: hrAssistantRole.id, menuItemId: menu.id } },
        update: {},
        create: { roleId: hrAssistantRole.id, menuItemId: menu.id },
      });
    }
  }

  // IT Manager - Full admin access to users, roles, settings
  const itManagerPerms = [
    ['users', 'read'], ['users', 'write'], ['users', 'delete'],
    ['settings', 'read'], ['settings', 'write'],
    ['employees', 'read'], ['company', 'read'],
  ];
  for (const [resource, action] of itManagerPerms) {
    const perm = allPermissions.find(p => p.resource === resource && p.action === action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: itManagerRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: itManagerRole.id, permissionId: perm.id },
      });
    }
  }

  // IT Manager menus
  const itManagerMenus = ['dashboard', 'settings', 'employees'];
  for (const key of itManagerMenus) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: { roleId_menuItemId: { roleId: itManagerRole.id, menuItemId: menu.id } },
        update: {},
        create: { roleId: itManagerRole.id, menuItemId: menu.id },
      });
    }
  }

  // IT Support - Limited settings access
  const itSupportPerms = [
    ['users', 'read'], ['settings', 'read'], ['employees', 'read'],
  ];
  for (const [resource, action] of itSupportPerms) {
    const perm = allPermissions.find(p => p.resource === resource && p.action === action);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: itSupportRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: itSupportRole.id, permissionId: perm.id },
      });
    }
  }

  // IT Support menus
  const itSupportMenus = ['dashboard', 'settings'];
  for (const key of itSupportMenus) {
    const menu = allMenuItems.find(m => m.key === key);
    if (menu) {
      await prisma.roleMenuPermission.upsert({
        where: { roleId_menuItemId: { roleId: itSupportRole.id, menuItemId: menu.id } },
        update: {},
        create: { roleId: itSupportRole.id, menuItemId: menu.id },
      });
    }
  }

  console.log('✅ Assigned permissions to HR and IT roles\n');

  // Get or create job titles
  const jobTitles = {
    ceo: await prisma.jobTitle.upsert({
      where: { name: 'Chief Executive Officer' },
      update: {},
      create: { name: 'Chief Executive Officer', nameAr: 'الرئيس التنفيذي' },
    }),
    gm: await prisma.jobTitle.upsert({
      where: { name: 'General Manager' },
      update: {},
      create: { name: 'General Manager', nameAr: 'المدير العام' },
    }),
    deptManager: await prisma.jobTitle.upsert({
      where: { name: 'Department Manager' },
      update: {},
      create: { name: 'Department Manager', nameAr: 'مدير القسم' },
    }),
    technicalHead: await prisma.jobTitle.upsert({
      where: { name: 'Technical Head' },
      update: {},
      create: { name: 'Technical Head', nameAr: 'رئيس فني' },
    }),
    technician: await prisma.jobTitle.upsert({
      where: { name: 'Technician' },
      update: {},
      create: { name: 'Technician', nameAr: 'فني' },
    }),
    helper: await prisma.jobTitle.upsert({
      where: { name: 'Helper' },
      update: {},
      create: { name: 'Helper', nameAr: 'مساعد' },
    }),
    accountant: await prisma.jobTitle.upsert({
      where: { name: 'Accountant' },
      update: {},
      create: { name: 'Accountant', nameAr: 'محاسب' },
    }),
    salesManager: await prisma.jobTitle.upsert({
      where: { name: 'Sales Manager' },
      update: {},
      create: { name: 'Sales Manager', nameAr: 'مدير المبيعات' },
    }),
    receptionist: await prisma.jobTitle.upsert({
      where: { name: 'Receptionist' },
      update: {},
      create: { name: 'Receptionist', nameAr: 'موظف استقبال' },
    }),
    hrManager: await prisma.jobTitle.upsert({
      where: { name: 'HR Manager' },
      update: {},
      create: { name: 'HR Manager', nameAr: 'مدير الموارد البشرية' },
    }),
    hrAssistant: await prisma.jobTitle.upsert({
      where: { name: 'HR Assistant' },
      update: {},
      create: { name: 'HR Assistant', nameAr: 'مساعد الموارد البشرية' },
    }),
    hrCoordinator: await prisma.jobTitle.upsert({
      where: { name: 'HR Coordinator' },
      update: {},
      create: { name: 'HR Coordinator', nameAr: 'منسق الموارد البشرية' },
    }),
    itManager: await prisma.jobTitle.upsert({
      where: { name: 'IT Manager' },
      update: {},
      create: { name: 'IT Manager', nameAr: 'مدير تقنية المعلومات' },
    }),
    itInfrastructure: await prisma.jobTitle.upsert({
      where: { name: 'IT Infrastructure Specialist' },
      update: {},
      create: { name: 'IT Infrastructure Specialist', nameAr: 'أخصائي البنية التحتية' },
    }),
    itSupport: await prisma.jobTitle.upsert({
      where: { name: 'IT Support Specialist' },
      update: {},
      create: { name: 'IT Support Specialist', nameAr: 'أخصائي الدعم الفني' },
    }),
  };

  console.log('✅ Created job titles\n');

  // Create Divisions
  const technicalDivision = await prisma.division.upsert({
    where: { id: 'div-technical' },
    update: {},
    create: {
      id: 'div-technical',
      companyId: company.id,
      name: 'Technical Operations',
      nameAr: 'العمليات الفنية',
      code: 'TECH',
    },
  });

  const supportDivision = await prisma.division.upsert({
    where: { id: 'div-support' },
    update: {},
    create: {
      id: 'div-support',
      companyId: company.id,
      name: 'Support Services',
      nameAr: 'خدمات الدعم',
      code: 'SUPPORT',
    },
  });

  const adminDivision = await prisma.division.upsert({
    where: { id: 'div-admin' },
    update: {},
    create: {
      id: 'div-admin',
      companyId: company.id,
      name: 'Administration',
      nameAr: 'الإدارة',
      code: 'ADMIN',
    },
  });

  console.log('✅ Created divisions: Technical Operations, Support Services, Administration\n');

  // Create Departments
  const departments = {
    hvac: await prisma.department.upsert({
      where: { id: 'dept-hvac' },
      update: {},
      create: {
        id: 'dept-hvac',
        divisionId: technicalDivision.id,
        name: 'HVAC',
        nameAr: 'التكييف والتبريد',
        code: 'HVAC',
      },
    }),
    fireSafety: await prisma.department.upsert({
      where: { id: 'dept-fire-safety' },
      update: {},
      create: {
        id: 'dept-fire-safety',
        divisionId: technicalDivision.id,
        name: 'Fire & Safety',
        nameAr: 'الحريق والسلامة',
        code: 'FIRE',
      },
    }),
    electrical: await prisma.department.upsert({
      where: { id: 'dept-electrical' },
      update: {},
      create: {
        id: 'dept-electrical',
        divisionId: technicalDivision.id,
        name: 'Electrical',
        nameAr: 'الكهرباء',
        code: 'ELEC',
      },
    }),
    plumbing: await prisma.department.upsert({
      where: { id: 'dept-plumbing' },
      update: {},
      create: {
        id: 'dept-plumbing',
        divisionId: technicalDivision.id,
        name: 'Plumbing',
        nameAr: 'السباكة',
        code: 'PLMB',
      },
    }),
    accounts: await prisma.department.upsert({
      where: { id: 'dept-accounts' },
      update: {},
      create: {
        id: 'dept-accounts',
        divisionId: supportDivision.id,
        name: 'Accounts',
        nameAr: 'المحاسبة',
        code: 'ACCT',
      },
    }),
    marketingSales: await prisma.department.upsert({
      where: { id: 'dept-marketing-sales' },
      update: {},
      create: {
        id: 'dept-marketing-sales',
        divisionId: supportDivision.id,
        name: 'Marketing & Sales',
        nameAr: 'التسويق والمبيعات',
        code: 'MKTG',
      },
    }),
    hr: await prisma.department.upsert({
      where: { id: 'dept-hr' },
      update: {},
      create: {
        id: 'dept-hr',
        divisionId: adminDivision.id,
        name: 'Human Resources',
        nameAr: 'الموارد البشرية',
        code: 'HR',
      },
    }),
    it: await prisma.department.upsert({
      where: { id: 'dept-it' },
      update: {},
      create: {
        id: 'dept-it',
        divisionId: adminDivision.id,
        name: 'Information Technology',
        nameAr: 'تقنية المعلومات',
        code: 'IT',
      },
    }),
  };

  console.log('✅ Created departments: HVAC, Fire & Safety, Electrical, Plumbing, Accounts, Marketing & Sales, HR, IT\n');

  // Create Zones (4 zones)
  const zones: Record<string, any> = {};
  const zoneNames = [
    { name: 'Juffair Zone', nameAr: 'منطقة الجفير', code: 'ZONE-JUF' },
    { name: 'Seef Zone', nameAr: 'منطقة السيف', code: 'ZONE-SEEF' },
    { name: 'Riffa Zone', nameAr: 'منطقة الرفاع', code: 'ZONE-RIFFA' },
    { name: 'Muharraq Zone', nameAr: 'منطقة المحرق', code: 'ZONE-MUH' },
  ];

  const district = await prisma.district.findFirst();
  if (!district) {
    throw new Error('No district found. Run main seed first.');
  }

  for (const zone of zoneNames) {
    const gov = await prisma.governorate.upsert({
      where: {
        districtId_name: {
          districtId: district.id,
          name: zone.name.replace(' Zone', ''),
        },
      },
      update: {},
      create: {
        districtId: district.id,
        name: zone.name.replace(' Zone', ''),
        nameAr: zone.nameAr.replace('منطقة ', ''),
        code: zone.code.replace('ZONE-', ''),
      },
    });

    zones[zone.code] = await prisma.zone.upsert({
      where: { code: zone.code },
      update: {},
      create: {
        governorateId: gov.id,
        name: zone.name,
        nameAr: zone.nameAr,
        code: zone.code,
      },
    });
  }

  console.log('✅ Created zones: Juffair, Seef, Riffa, Muharraq\n');

  // Helper to create employee with nationality
  async function createEmployee(data: {
    firstName: string;
    lastName: string;
    firstNameAr?: string;
    lastNameAr?: string;
    jobTitleId: string;
    roleId: string;
    divisionId?: string;
    departmentId?: string;
    managerId?: string;
    hasSystemAccess?: boolean;
  }) {
    const empNo = getNextEmployeeNo();
    const email = generateUniqueEmail(data.firstName, data.lastName);

    let userId: string | undefined;
    if (data.hasSystemAccess) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: generatePhone(),
          roleId: data.roleId,
          isActive: true,
          isVerified: true,
        },
      });
      userId = user.id;
    }

    const employee = await prisma.employee.upsert({
      where: { email },
      update: {},
      create: {
        userId,
        employeeNo: empNo,
        firstName: data.firstName,
        lastName: data.lastName,
        firstNameAr: data.firstNameAr || data.firstName,
        lastNameAr: data.lastNameAr || data.lastName,
        email,
        phone: generatePhone(),
        nationalId: generateNationalId(),
        dateOfBirth: getRandomDate(1970, 1995),
        hireDate: getRandomDate(2018, 2024),
        jobTitleId: data.jobTitleId,
        companyId: company.id,
        divisionId: data.divisionId,
        departmentId: data.departmentId,
        managerId: data.managerId,
        hasSystemAccess: data.hasSystemAccess || false,
        isActive: true,
      },
    });

    return employee;
  }

  // =============================================
  // CREATE EMPLOYEES
  // =============================================

  console.log('👔 Creating Executive Level (Bahraini)...');

  // CEO - Bahraini
  const ceoName = getNameFromPool(BAHRAINI_MALE_NAMES, 'bahraini');
  const ceo = await createEmployee({
    ...ceoName,
    firstNameAr: BAHRAINI_MALE_NAMES.firstAr[ceoName.firstName as keyof typeof BAHRAINI_MALE_NAMES.firstAr],
    lastNameAr: BAHRAINI_MALE_NAMES.lastAr[ceoName.lastName as keyof typeof BAHRAINI_MALE_NAMES.lastAr],
    jobTitleId: jobTitles.ceo.id,
    roleId: adminRole.id,
    hasSystemAccess: true,
  });
  console.log(`   CEO: ${ceo.firstName} ${ceo.lastName} (Bahraini)`);

  // General Manager - British
  const gmName = getNameFromPool(BRITISH_MALE_NAMES, 'british');
  const gm = await createEmployee({
    ...gmName,
    jobTitleId: jobTitles.gm.id,
    roleId: adminRole.id,
    managerId: ceo.id,
    hasSystemAccess: true,
  });
  console.log(`   GM: ${gm.firstName} ${gm.lastName} (British)\n`);

  // =============================================
  // FRONT DESK RECEPTIONISTS (Filipino and Arabic females)
  // =============================================
  console.log('💁 Creating Front Desk Staff (Filipino & Arabic)...');

  // Filipino Receptionist
  const filipinoName = getNameFromPool(FILIPINO_FEMALE_NAMES, 'filipino');
  const receptionist1 = await createEmployee({
    ...filipinoName,
    jobTitleId: jobTitles.receptionist.id,
    roleId: receptionistRole.id,
    divisionId: supportDivision.id,
    departmentId: departments.marketingSales.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   Receptionist 1: ${receptionist1.firstName} ${receptionist1.lastName} (Filipino)`);

  // Arabic Receptionist
  const arabicFemaleName = getNameFromPool(ARABIC_FEMALE_NAMES, 'arabicFemale');
  const receptionist2 = await createEmployee({
    ...arabicFemaleName,
    firstNameAr: ARABIC_FEMALE_NAMES.firstAr[arabicFemaleName.firstName as keyof typeof ARABIC_FEMALE_NAMES.firstAr],
    lastNameAr: ARABIC_FEMALE_NAMES.lastAr[arabicFemaleName.lastName as keyof typeof ARABIC_FEMALE_NAMES.lastAr],
    jobTitleId: jobTitles.receptionist.id,
    roleId: receptionistRole.id,
    divisionId: supportDivision.id,
    departmentId: departments.marketingSales.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   Receptionist 2: ${receptionist2.firstName} ${receptionist2.lastName} (Arabic)\n`);

  // =============================================
  // HR DEPARTMENT (3 people)
  // =============================================
  console.log('👥 Creating HR Department...');

  // HR Manager - Bahraini
  const hrManagerName = getNameFromPool(BAHRAINI_MALE_NAMES, 'bahraini');
  const hrManager = await createEmployee({
    ...hrManagerName,
    firstNameAr: BAHRAINI_MALE_NAMES.firstAr[hrManagerName.firstName as keyof typeof BAHRAINI_MALE_NAMES.firstAr],
    lastNameAr: BAHRAINI_MALE_NAMES.lastAr[hrManagerName.lastName as keyof typeof BAHRAINI_MALE_NAMES.lastAr],
    jobTitleId: jobTitles.hrManager.id,
    roleId: hrManagerRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.hr.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   HR Manager: ${hrManager.firstName} ${hrManager.lastName} (Bahraini)`);

  // HR Assistant - Indian
  const hrAssistantName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
  const hrAssistant = await createEmployee({
    ...hrAssistantName,
    jobTitleId: jobTitles.hrAssistant.id,
    roleId: hrAssistantRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.hr.id,
    managerId: hrManager.id,
    hasSystemAccess: true,
  });
  console.log(`   HR Assistant: ${hrAssistant.firstName} ${hrAssistant.lastName} (Indian)`);

  // HR Coordinator - Pakistani
  const hrCoordinatorName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
  const hrCoordinator = await createEmployee({
    ...hrCoordinatorName,
    jobTitleId: jobTitles.hrCoordinator.id,
    roleId: hrAssistantRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.hr.id,
    managerId: hrManager.id,
    hasSystemAccess: true,
  });
  console.log(`   HR Coordinator: ${hrCoordinator.firstName} ${hrCoordinator.lastName} (Pakistani)\n`);

  // =============================================
  // IT DEPARTMENT (3 people)
  // =============================================
  console.log('💻 Creating IT Department...');

  // IT Manager - Indian
  const itManagerName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
  const itManager = await createEmployee({
    ...itManagerName,
    jobTitleId: jobTitles.itManager.id,
    roleId: itManagerRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.it.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   IT Manager: ${itManager.firstName} ${itManager.lastName} (Indian)`);

  // IT Infrastructure - Pakistani
  const itInfraName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
  const itInfra = await createEmployee({
    ...itInfraName,
    jobTitleId: jobTitles.itInfrastructure.id,
    roleId: itSupportRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.it.id,
    managerId: itManager.id,
    hasSystemAccess: true,
  });
  console.log(`   IT Infrastructure: ${itInfra.firstName} ${itInfra.lastName} (Pakistani)`);

  // IT Support - Bangladeshi
  const itSupportName = getNameFromPool(BANGLADESHI_MALE_NAMES, 'bangladeshi');
  const itSupportEmp = await createEmployee({
    ...itSupportName,
    jobTitleId: jobTitles.itSupport.id,
    roleId: itSupportRole.id,
    divisionId: adminDivision.id,
    departmentId: departments.it.id,
    managerId: itManager.id,
    hasSystemAccess: true,
  });
  console.log(`   IT Support: ${itSupportEmp.firstName} ${itSupportEmp.lastName} (Bangladeshi)\n`);

  // =============================================
  // TECHNICAL DEPARTMENT MANAGERS (Mix of Indian, Pakistani, Bahraini)
  // =============================================
  console.log('👷 Creating Technical Department Managers...');

  const deptManagers: Record<string, any> = {};
  const techDepts = [
    { key: 'hvac', dept: departments.hvac, name: 'HVAC', nationality: 'indian' },
    { key: 'fireSafety', dept: departments.fireSafety, name: 'Fire & Safety', nationality: 'pakistani' },
    { key: 'electrical', dept: departments.electrical, name: 'Electrical', nationality: 'bahraini' },
    { key: 'plumbing', dept: departments.plumbing, name: 'Plumbing', nationality: 'indian' },
  ];

  for (const d of techDepts) {
    let mgrName;
    let firstNameAr, lastNameAr;

    if (d.nationality === 'bahraini') {
      mgrName = getNameFromPool(BAHRAINI_MALE_NAMES, 'bahraini');
      firstNameAr = BAHRAINI_MALE_NAMES.firstAr[mgrName.firstName as keyof typeof BAHRAINI_MALE_NAMES.firstAr];
      lastNameAr = BAHRAINI_MALE_NAMES.lastAr[mgrName.lastName as keyof typeof BAHRAINI_MALE_NAMES.lastAr];
    } else if (d.nationality === 'pakistani') {
      mgrName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
    } else {
      mgrName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
    }

    deptManagers[d.key] = await createEmployee({
      ...mgrName,
      firstNameAr,
      lastNameAr,
      jobTitleId: jobTitles.deptManager.id,
      roleId: managerRole.id,
      divisionId: technicalDivision.id,
      departmentId: d.dept.id,
      managerId: gm.id,
      hasSystemAccess: true,
    });
    console.log(`   ${d.name} Manager: ${deptManagers[d.key].firstName} ${deptManagers[d.key].lastName} (${d.nationality})`);
  }

  // =============================================
  // SUPPORT DEPARTMENT MANAGERS
  // =============================================
  console.log('\n📊 Creating Support Department Managers...');

  // Accounts Manager - Bahraini
  const accountsName = getNameFromPool(BAHRAINI_MALE_NAMES, 'bahraini');
  const accountsManager = await createEmployee({
    ...accountsName,
    firstNameAr: BAHRAINI_MALE_NAMES.firstAr[accountsName.firstName as keyof typeof BAHRAINI_MALE_NAMES.firstAr],
    lastNameAr: BAHRAINI_MALE_NAMES.lastAr[accountsName.lastName as keyof typeof BAHRAINI_MALE_NAMES.lastAr],
    jobTitleId: jobTitles.accountant.id,
    roleId: managerRole.id,
    divisionId: supportDivision.id,
    departmentId: departments.accounts.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   Accounts Manager: ${accountsManager.firstName} ${accountsManager.lastName} (Bahraini)`);

  // Marketing & Sales Manager - Pakistani
  const salesName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
  const salesManager = await createEmployee({
    ...salesName,
    jobTitleId: jobTitles.salesManager.id,
    roleId: managerRole.id,
    divisionId: supportDivision.id,
    departmentId: departments.marketingSales.id,
    managerId: gm.id,
    hasSystemAccess: true,
  });
  console.log(`   Marketing & Sales Manager: ${salesManager.firstName} ${salesManager.lastName} (Pakistani)\n`);

  // =============================================
  // TECHNICAL TEAMS (per department per zone)
  // Technical Heads: Indian, Pakistani, Bangladeshi mix
  // Helpers: Indian, Sri Lankan, Bangladeshi mix
  // =============================================
  const zoneKeys = Object.keys(zones);
  const techHeadNationalities = ['indian', 'pakistani', 'bangladeshi', 'indian'];
  const helperNationalities = ['indian', 'srilankan', 'bangladeshi'];

  for (const d of techDepts) {
    console.log(`\n🔧 Creating ${d.name} Department Teams...`);

    let zoneIndex = 0;
    for (const zoneCode of zoneKeys) {
      const zone = zones[zoneCode];
      const zoneName = zone.name.replace(' Zone', '');

      // Technical Head - rotating nationalities
      const techHeadNat = techHeadNationalities[zoneIndex % techHeadNationalities.length];
      let techHeadName;
      if (techHeadNat === 'indian') {
        techHeadName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
      } else if (techHeadNat === 'pakistani') {
        techHeadName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
      } else {
        techHeadName = getNameFromPool(BANGLADESHI_MALE_NAMES, 'bangladeshi');
      }

      const techHead = await createEmployee({
        ...techHeadName,
        jobTitleId: jobTitles.technicalHead.id,
        roleId: managerRole.id,
        divisionId: technicalDivision.id,
        departmentId: d.dept.id,
        managerId: deptManagers[d.key].id,
        hasSystemAccess: true,
      });
      console.log(`   ${zoneName} Tech Head: ${techHead.firstName} ${techHead.lastName} (${techHeadNat})`);

      // Assign tech head to zone
      await prisma.employeeZone.upsert({
        where: {
          employeeId_zoneId: {
            employeeId: techHead.id,
            zoneId: zone.id,
          },
        },
        update: { role: 'PRIMARY_HEAD' },
        create: {
          employeeId: techHead.id,
          zoneId: zone.id,
          role: 'PRIMARY_HEAD',
          isPrimary: true,
          isActive: true,
        },
      });

      // 3 Technicians - mix of Indian, Pakistani, Bangladeshi
      for (let t = 0; t < 3; t++) {
        const techNat = ['indian', 'pakistani', 'bangladeshi'][t];
        let techName;
        if (techNat === 'indian') {
          techName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
        } else if (techNat === 'pakistani') {
          techName = getNameFromPool(PAKISTANI_MALE_NAMES, 'pakistani');
        } else {
          techName = getNameFromPool(BANGLADESHI_MALE_NAMES, 'bangladeshi');
        }

        const technician = await createEmployee({
          ...techName,
          jobTitleId: jobTitles.technician.id,
          roleId: technicianRole.id,
          divisionId: technicalDivision.id,
          departmentId: d.dept.id,
          managerId: techHead.id,
          hasSystemAccess: true,
        });

        await prisma.employeeZone.upsert({
          where: {
            employeeId_zoneId: {
              employeeId: technician.id,
              zoneId: zone.id,
            },
          },
          update: { role: 'TECHNICIAN' },
          create: {
            employeeId: technician.id,
            zoneId: zone.id,
            role: 'TECHNICIAN',
            isPrimary: true,
            isActive: true,
          },
        });

        console.log(`      Technician: ${technician.firstName} ${technician.lastName} (${techNat})`);
      }

      // 3 Helpers - mix of Indian, Sri Lankan, Bangladeshi
      for (let h = 0; h < 3; h++) {
        const helperNat = helperNationalities[h % helperNationalities.length];
        let helperName;
        if (helperNat === 'indian') {
          helperName = getNameFromPool(INDIAN_MALE_NAMES, 'indian');
        } else if (helperNat === 'srilankan') {
          helperName = getNameFromPool(SRI_LANKAN_MALE_NAMES, 'srilankan');
        } else {
          helperName = getNameFromPool(BANGLADESHI_MALE_NAMES, 'bangladeshi');
        }

        const helper = await createEmployee({
          ...helperName,
          jobTitleId: jobTitles.helper.id,
          roleId: technicianRole.id,
          divisionId: technicalDivision.id,
          departmentId: d.dept.id,
          managerId: techHead.id,
          hasSystemAccess: false,
        });

        await prisma.employeeZone.upsert({
          where: {
            employeeId_zoneId: {
              employeeId: helper.id,
              zoneId: zone.id,
            },
          },
          update: { role: 'HELPER' },
          create: {
            employeeId: helper.id,
            zoneId: zone.id,
            role: 'HELPER',
            isPrimary: true,
            isActive: true,
          },
        });

        console.log(`      Helper: ${helper.firstName} ${helper.lastName} (${helperNat})`);
      }

      zoneIndex++;
    }
  }

  // =============================================
  // SUMMARY
  // =============================================
  const totalEmployees = await prisma.employee.count();
  const totalUsers = await prisma.user.count();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Employee Seeding Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total Employees: ${totalEmployees}`);
  console.log(`   Total Users (with system access): ${totalUsers}`);
  console.log('\n📋 Organization Structure:');
  console.log('   Executive: CEO (Bahraini), GM (British)');
  console.log('   Front Desk: 2 Receptionists (Filipino, Arabic)');
  console.log('   HR Department: HR Manager (Bahraini), HR Assistant (Indian), HR Coordinator (Pakistani)');
  console.log('   IT Department: IT Manager (Indian), IT Infra (Pakistani), IT Support (Bangladeshi)');
  console.log('   Technical Dept Managers: HVAC, Fire & Safety, Electrical, Plumbing (Mix of Indian, Pakistani, Bahraini)');
  console.log('   Support Dept Managers: Accounts (Bahraini), Marketing & Sales (Pakistani)');
  console.log('   Per Technical Department (x4):');
  console.log('      - 4 Technical Heads (Indian, Pakistani, Bangladeshi mix)');
  console.log('      - 12 Technicians (Indian, Pakistani, Bangladeshi mix)');
  console.log('      - 12 Helpers (Indian, Sri Lankan, Bangladeshi mix)');
  console.log('\n🔑 Default Password for all employees: Employee123');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Employee seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
