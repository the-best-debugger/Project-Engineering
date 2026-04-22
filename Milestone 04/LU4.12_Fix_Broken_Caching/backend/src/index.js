const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const cacheService = require('./services/cacheService');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// GET /tasks
app.get('/tasks', async (req, res) => {
  try {
    const cacheKey = cacheService.createTaskListKey();
    const cachedTasks = cacheService.get(cacheKey);
    if (cachedTasks) {
      return res.status(200).json(cachedTasks);
    }

    const tasks = await prisma.task.findMany();
    cacheService.set(cacheKey, tasks);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/:id
app.get('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId)) {
    return res.status(400).json({ error: 'Task id must be a valid number' });
  }

  try {
    const cacheKey = cacheService.createTaskKey(taskId);
    const cachedTask = cacheService.get(cacheKey);
    if (cachedTask) {
      return res.status(200).json(cachedTask);
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    cacheService.set(cacheKey, task);
    res.status(200).json(task);
  } catch (err) {
    console.error('Error fetching task', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /tasks
app.post('/tasks', async (req, res) => {
  const { title, description, price } = req.body;

  const parsedPrice = Number(price);
  if (!title || !description || Number.isNaN(parsedPrice)) {
    return res.status(400).json({ error: 'title, description and valid price are required' });
  }

  try {
    const newTask = await prisma.task.create({
      data: { title, description, price: parsedPrice }
    });

    cacheService.delete(cacheService.createTaskListKey());
    cacheService.set(cacheService.createTaskKey(newTask.id), newTask);

    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id
app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId)) {
    return res.status(400).json({ error: 'Task id must be a valid number' });
  }

  const { title, description, price } = req.body;
  const updateData = {};

  if (title !== undefined) {
    updateData.title = title;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'price must be a valid number' });
    }
    updateData.price = parsedPrice;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'At least one field is required for update' });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    cacheService.invalidateTask(taskId);
    cacheService.set(cacheService.createTaskKey(taskId), updatedTask);
    res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.error('Error updating task', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId)) {
    return res.status(400).json({ error: 'Task id must be a valid number' });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId }
    });

    cacheService.invalidateTask(taskId);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.error('Error deleting task', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Broken Server running on http://localhost:${PORT}`);
});
