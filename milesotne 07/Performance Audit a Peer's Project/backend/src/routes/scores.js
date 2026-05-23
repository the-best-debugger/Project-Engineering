const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;

const scoreListSelect = {
  id: true,
  game: true,
  player: true,
  score: true,
  date: true,
};

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.score.findMany({
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: scoreListSelect,
      }),
      prisma.score.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

module.exports = router;
