import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateInventoryItemInput, UpdateInventoryItemInput, ListInventoryItemsQuery } from './inventory-item.schema.js';

export class InventoryItemService {
  private async generateItemNo(): Promise<string> {
    const lastItem = await prisma.inventoryItem.findFirst({
      orderBy: { itemNo: 'desc' },
      where: { itemNo: { startsWith: 'ITM-' } },
    });

    if (!lastItem) {
      return 'ITM-0001';
    }

    const lastNum = parseInt(lastItem.itemNo.replace('ITM-', ''), 10);
    const nextNum = lastNum + 1;
    return `ITM-${nextNum.toString().padStart(4, '0')}`;
  }

  async create(input: CreateInventoryItemInput) {
    // Check if category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const itemNo = await this.generateItemNo();

    const item = await prisma.inventoryItem.create({
      data: {
        ...input,
        itemNo,
      },
      include: {
        category: true,
      },
    });

    return item;
  }

  async findById(id: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    return item;
  }

  async findAll(query: ListInventoryItemsQuery) {
    const { search, categoryId, isActive, lowStock } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { itemNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Low stock filter - items where currentStock <= minStock
    if (lowStock === true) {
      where.AND = [
        ...(where.AND || []),
        {
          currentStock: {
            lte: prisma.$queryRaw`"min_stock"`,
          },
        },
      ];
      // Alternative approach using raw comparison
      where.currentStock = { lte: 0 }; // This is a placeholder, will be handled in query
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: lowStock
          ? { ...where, currentStock: undefined } // Remove placeholder
          : where,
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.inventoryItem.count({
        where: lowStock
          ? { ...where, currentStock: undefined }
          : where
      }),
    ]);

    // Filter low stock items in JavaScript for accurate comparison
    const filteredItems = lowStock
      ? items.filter(item => item.currentStock <= item.minStock)
      : items;

    return {
      data: filteredItems,
      pagination: {
        page,
        limit,
        total: lowStock ? filteredItems.length : total,
        totalPages: Math.ceil((lowStock ? filteredItems.length : total) / limit),
      },
    };
  }

  async update(id: string, input: UpdateInventoryItemInput) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Inventory item not found');
    }

    // Check if category exists when updating
    if (input.categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: input,
      include: {
        category: true,
      },
    });

    return item;
  }

  async delete(id: string) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Inventory item not found');
    }

    // Soft delete - mark as inactive
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Inventory item deleted successfully' };
  }

  async updateStock(id: string, quantity: number, type: 'add' | 'subtract') {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    const newStock = type === 'add'
      ? item.currentStock + quantity
      : item.currentStock - quantity;

    if (newStock < 0) {
      throw new ConflictError('Cannot reduce stock below 0');
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
      include: {
        category: true,
      },
    });

    return updated;
  }

  async getLowStockItems() {
    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Filter items where current stock is at or below minimum
    return items.filter(item => item.currentStock <= item.minStock);
  }
}
