const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks for a board
router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    const tasks = await Task.find({ boardId }).sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    const io = req.app.get('io');
    io.to(req.body.boardId).emit('task-updated', { type: 'created', task });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task (including drag and drop)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const io = req.app.get('io');
    io.to(task.boardId.toString()).emit('task-updated', { type: 'updated', task });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    io.to(task.boardId.toString()).emit('task-updated', { type: 'deleted', taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;