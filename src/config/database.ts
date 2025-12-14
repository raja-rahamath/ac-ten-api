import { PrismaClient } from '@prisma/client';
import { config } from './index.js';
import { logger } from './logger.js';
import { getCurrentUserId } from './audit-context.js';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Models that don't have createdById/updatedById fields (join tables, etc.)
const MODELS_WITHOUT_AUDIT_FIELDS = new Set([
  'RolePermission',
  'RoleMenuPermission',
  'ZoneArea',
  'EmployeeZone',
  'ScheduleTeam',
  'WorkOrderTeam',
  'CustomerProperty',
  'CustomerUnit',
  'AmcContractProperty',
  'AmcContractService',
  'OnboardingProgress',
  'BusinessSettings',
]);

function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: config.isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
  });

  if (config.isDevelopment) {
    // Log queries in development
    baseClient.$on('query' as never, (e: { query: string; duration: number }) => {
      logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma Query');
    });
  }

  // Extend with audit column middleware
  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          // Skip models without audit fields
          if (MODELS_WITHOUT_AUDIT_FIELDS.has(model)) {
            return query(args);
          }

          const userId = getCurrentUserId();

          // Add createdById if not already set and model has this field
          if (userId && args.data && typeof args.data === 'object') {
            const data = args.data as Record<string, unknown>;
            if (!('createdById' in data)) {
              data.createdById = userId;
            }
          }

          return query(args);
        },

        async createMany({ model, args, query }) {
          // Skip models without audit fields
          if (MODELS_WITHOUT_AUDIT_FIELDS.has(model)) {
            return query(args);
          }

          const userId = getCurrentUserId();

          if (userId && args.data) {
            const dataArray = Array.isArray(args.data) ? args.data : [args.data];
            // Mutate items in place to preserve type
            for (const item of dataArray) {
              if (typeof item === 'object' && item !== null) {
                const record = item as Record<string, unknown>;
                if (!('createdById' in record)) {
                  record.createdById = userId;
                }
              }
            }
          }

          return query(args);
        },

        async update({ model, args, query }) {
          // Skip models without audit fields
          if (MODELS_WITHOUT_AUDIT_FIELDS.has(model)) {
            return query(args);
          }

          const userId = getCurrentUserId();

          // Add updatedById if not already set
          if (userId && args.data && typeof args.data === 'object') {
            const data = args.data as Record<string, unknown>;
            if (!('updatedById' in data)) {
              data.updatedById = userId;
            }
          }

          return query(args);
        },

        async updateMany({ model, args, query }) {
          // Skip models without audit fields
          if (MODELS_WITHOUT_AUDIT_FIELDS.has(model)) {
            return query(args);
          }

          const userId = getCurrentUserId();

          if (userId && args.data && typeof args.data === 'object') {
            const data = args.data as Record<string, unknown>;
            if (!('updatedById' in data)) {
              data.updatedById = userId;
            }
          }

          return query(args);
        },

        async upsert({ model, args, query }) {
          // Skip models without audit fields
          if (MODELS_WITHOUT_AUDIT_FIELDS.has(model)) {
            return query(args);
          }

          const userId = getCurrentUserId();

          if (userId) {
            // Set createdById for create operation
            if (args.create && typeof args.create === 'object') {
              const createData = args.create as Record<string, unknown>;
              if (!('createdById' in createData)) {
                createData.createdById = userId;
              }
            }

            // Set updatedById for update operation
            if (args.update && typeof args.update === 'object') {
              const updateData = args.update as Record<string, unknown>;
              if (!('updatedById' in updateData)) {
                updateData.updatedById = userId;
              }
            }
          }

          return query(args);
        },
      },
    },
  });

  return extendedClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}
