import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const MAX_LIMIT = 100;

export const PRODUCT_SORTABLE_FIELDS = new Set([
  'id',
  'name',
  'price',
  'category',
  'stock',
  'createdAt',
  'updatedAt',
]);

export const PRODUCT_SELECTABLE_FIELDS = new Set([
  'id',
  'name',
  'description',
  'price',
  'category',
  'stock',
  'imageUrl',
  'isActive',
  'createdAt',
  'updatedAt',
]);

export async function getProducts(options) {
  const { page, limit, sortBy, order, fields } = options;
  const skip = (page - 1) * limit;
  const select = fields?.length
    ? Object.fromEntries(fields.map((field) => [field, true]))
    : undefined;

  const [total, data] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      sortBy,
      order,
    },
    data,
  };
}

export async function getProductById(id) {
  return prisma.product.findUnique({ where: { id } });
}