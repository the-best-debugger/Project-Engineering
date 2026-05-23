const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient({
  log: process.env.LOG_QUERIES === 'true' ? ['query'] : [],
});

const PORT = process.env.PORT || 3001;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

const missionListSelect = {
  id: true,
  name: true,
  launchDate: true,
  rocket: true,
  crew: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

app.use(cors());
app.use(compression());
app.use(express.json());

app.get('/api/missions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.mission.findMany({
        skip,
        take: limit,
        orderBy: { launchDate: 'desc' },
        select: missionListSelect,
      }),
      prisma.mission.count(),
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
