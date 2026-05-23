import { Router } from 'express';
import { prisma } from '../prisma.config';

const router = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/orders?page=1&limit=20
 * Single Prisma query with nested select, pagination, trimmed payload.
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [orders, total, revenueAgg, customerCount] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                  image: true,
                  category: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary: {
        totalRevenue: revenueAgg._sum.total ?? 0,
        totalOrders: total,
        activeCustomers: customerCount,
        avgOrderValue: total > 0 ? (revenueAgg._sum.total ?? 0) / total : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
