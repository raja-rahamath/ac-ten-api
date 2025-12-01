import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesQuery } from './employee.schema.js';
import { emailService } from '../../services/email.service.js';
import { logger } from '../../config/logger.js';
import * as XLSX from 'xlsx';

function generateEmployeeNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `EMP${timestamp}${random}`;
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%&*';
  let password = '';

  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Add 1 special character
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  // Add 2 random digits
  password += Math.floor(Math.random() * 10);
  password += Math.floor(Math.random() * 10);

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export class EmployeeService {
  async create(input: CreateEmployeeInput) {
    const employeeNo = generateEmployeeNo();
    const { roleId, zoneIds, isZoneHead, ...employeeData } = input;

    // Generate placeholder email if not provided (for helpers without email)
    const email = input.email || `${employeeNo.toLowerCase()}@noemail.local`;

    // Check if email exists globally
    const existingGlobal = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingGlobal) {
      throw new ConflictError('Employee with this email already exists');
    }

    // Check if email exists within the same company (only for real emails)
    if (input.email && input.companyId) {
      const existingInCompany = await prisma.employee.findFirst({
        where: {
          email: input.email,
          companyId: input.companyId,
        },
      });

      if (existingInCompany) {
        throw new ConflictError('An employee with this email already exists in this company');
      }
    }

    // Validate: if hasSystemAccess is true, email and roleId are required
    if (input.hasSystemAccess) {
      if (!input.email) {
        throw new ValidationError('Email is required when system access is enabled');
      }
      if (!roleId) {
        throw new ValidationError('Role is required when system access is enabled');
      }

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new ConflictError('A user account with this email already exists');
      }
    }

    // Generate temporary password if system access is enabled
    let temporaryPassword: string | undefined;
    let userId: string | undefined;

    if (input.hasSystemAccess && input.email && roleId) {
      temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      // Create User account first
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          roleId: roleId,
          isActive: true,
          isVerified: false, // Will be verified on first login
        },
      });

      userId = user.id;
    }

    // Create Employee record
    const employee = await prisma.employee.create({
      data: {
        employeeNo,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        firstNameAr: employeeData.firstNameAr,
        lastNameAr: employeeData.lastNameAr,
        email,
        phone: employeeData.phone,
        nationalId: employeeData.nationalId,
        dateOfBirth: employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth) : undefined,
        hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : undefined,
        jobTitleId: employeeData.jobTitleId,
        companyId: employeeData.companyId,
        divisionId: employeeData.divisionId,
        departmentId: employeeData.departmentId,
        sectionId: employeeData.sectionId,
        managerId: employeeData.managerId,
        hasSystemAccess: employeeData.hasSystemAccess,
        userId: userId,
      },
      include: {
        jobTitle: true,
        company: true,
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Create zone assignments if provided
    if (zoneIds && zoneIds.length > 0) {
      await prisma.employeeZone.createMany({
        data: zoneIds.map((zoneId, index) => ({
          employeeId: employee.id,
          zoneId: zoneId,
          isPrimary: index === 0, // First zone is primary
        })),
      });
    }

    // Send welcome email if system access is enabled
    if (temporaryPassword && input.email) {
      const companyName = employee.company?.name ?? undefined;

      try {
        await emailService.sendNewEmployeeEmail({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: input.email,
          temporaryPassword,
          companyName,
        });
        logger.info({ employeeId: employee.id, email: input.email }, 'Welcome email sent to new employee');
      } catch (error) {
        // Log error but don't fail the employee creation
        logger.error({ error, employeeId: employee.id, email: input.email }, 'Failed to send welcome email');
      }
    }

    // Return employee with temporary password (only returned once)
    return {
      ...employee,
      temporaryPassword: temporaryPassword || undefined,
      emailSent: temporaryPassword ? emailService.isEmailConfigured() : false,
    };
  }

  async findById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        jobTitle: true,
        company: true,
        division: true,
        department: true,
        section: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        zoneAssignments: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employee;
  }

  async findAll(query: ListEmployeesQuery) {
    const { search, companyId, departmentId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          jobTitle: true,
          company: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateEmployeeInput) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Employee not found');
    }

    // Check email uniqueness if being updated
    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      },
      include: {
        jobTitle: true,
        company: true,
        department: true,
      },
    });

    return employee;
  }

  async delete(id: string) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Employee not found');
    }

    // Soft delete
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Employee deleted successfully' };
  }

  async exportToExcel() {
    const employees = await prisma.employee.findMany({
      include: {
        jobTitle: true,
        company: true,
        division: true,
        department: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = employees.map((emp) => ({
      'Employee No': emp.employeeNo,
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'First Name (Arabic)': emp.firstNameAr || '',
      'Last Name (Arabic)': emp.lastNameAr || '',
      'Email': emp.email?.includes('@noemail.local') ? '' : emp.email,
      'Phone': emp.phone || '',
      'National ID': emp.nationalId || '',
      'Date of Birth': emp.dateOfBirth ? emp.dateOfBirth.toISOString().split('T')[0] : '',
      'Hire Date': emp.hireDate ? emp.hireDate.toISOString().split('T')[0] : '',
      'Company': emp.company?.name || '',
      'Division': emp.division?.name || '',
      'Department': emp.department?.name || '',
      'Section': emp.section?.name || '',
      'Job Title': emp.jobTitle?.name || '',
      'Has System Access': emp.hasSystemAccess ? 'Yes' : 'No',
      'Is Active': emp.isActive ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Employee No
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 18 }, // First Name (Arabic)
      { wch: 18 }, // Last Name (Arabic)
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // National ID
      { wch: 12 }, // Date of Birth
      { wch: 12 }, // Hire Date
      { wch: 20 }, // Company
      { wch: 15 }, // Division
      { wch: 15 }, // Department
      { wch: 15 }, // Section
      { wch: 20 }, // Job Title
      { wch: 18 }, // Has System Access
      { wch: 10 }, // Is Active
    ];
    ws['!cols'] = colWidths;

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async getImportTemplate() {
    const data = [
      {
        'First Name *': 'John',
        'Last Name *': 'Doe',
        'First Name (Arabic)': '',
        'Last Name (Arabic)': '',
        'Email': 'john.doe@example.com',
        'Phone': '+97312345678',
        'National ID': '123456789',
        'Date of Birth (YYYY-MM-DD)': '1990-01-15',
        'Hire Date (YYYY-MM-DD)': '2024-01-01',
        'Company Name': 'Main Company',
        'Division Name': 'Operations',
        'Department Name': 'Cleaning',
        'Job Title': 'Cleaner',
        'Has System Access (Yes/No)': 'No',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');

    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 22 },
      { wch: 22 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 25 },
    ];
    ws['!cols'] = colWidths;

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (rows.length === 0) {
      throw new ValidationError('Excel file is empty');
    }

    // Get lookup maps for companies, divisions, departments, job titles
    const [companies, divisions, departments, jobTitles] = await Promise.all([
      prisma.company.findMany({ select: { id: true, name: true } }),
      prisma.division.findMany({ select: { id: true, name: true } }),
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.jobTitle.findMany({ select: { id: true, name: true } }),
    ]);

    const companyMap = new Map(companies.map(c => [c.name.toLowerCase(), c.id]));
    const divisionMap = new Map(divisions.map(d => [d.name.toLowerCase(), d.id]));
    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));
    const jobTitleMap = new Map(jobTitles.map(j => [j.name.toLowerCase(), j.id]));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        const firstName = row['First Name *'] || row['First Name'];
        const lastName = row['Last Name *'] || row['Last Name'];

        if (!firstName || !lastName) {
          throw new Error('First Name and Last Name are required');
        }

        const employeeNo = generateEmployeeNo();
        const emailFromRow = row['Email'] || '';
        const email = emailFromRow || `${employeeNo.toLowerCase()}@noemail.local`;

        // Check if email already exists (skip placeholder emails)
        if (emailFromRow) {
          const existingEmployee = await prisma.employee.findUnique({
            where: { email },
          });
          if (existingEmployee) {
            throw new Error(`Email ${email} already exists`);
          }
        }

        const parseDate = (dateStr: string | undefined): Date | undefined => {
          if (!dateStr) return undefined;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : date;
        };

        const companyName = row['Company Name'] || '';
        const divisionName = row['Division Name'] || '';
        const departmentName = row['Department Name'] || '';
        const jobTitleName = row['Job Title'] || '';

        await prisma.employee.create({
          data: {
            employeeNo,
            firstName,
            lastName,
            firstNameAr: row['First Name (Arabic)'] || undefined,
            lastNameAr: row['Last Name (Arabic)'] || undefined,
            email,
            phone: row['Phone'] || undefined,
            nationalId: row['National ID'] || undefined,
            dateOfBirth: parseDate(row['Date of Birth (YYYY-MM-DD)'] || row['Date of Birth']),
            hireDate: parseDate(row['Hire Date (YYYY-MM-DD)'] || row['Hire Date']),
            companyId: companyName ? companyMap.get(companyName.toLowerCase()) : undefined,
            divisionId: divisionName ? divisionMap.get(divisionName.toLowerCase()) : undefined,
            departmentId: departmentName ? departmentMap.get(departmentName.toLowerCase()) : undefined,
            jobTitleId: jobTitleName ? jobTitleMap.get(jobTitleName.toLowerCase()) : undefined,
            hasSystemAccess: (row['Has System Access (Yes/No)'] || row['Has System Access'] || '').toLowerCase() === 'yes',
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}
