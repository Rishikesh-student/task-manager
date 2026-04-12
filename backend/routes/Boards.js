const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');

// Get all boards for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }]
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single board
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create board
router.post('/', async (req, res) => {
  try {
    const { title, description, owner } = req.body;
    const board = new Board({
      title,
      description,
      owner,
      members: [owner],
      lists: [
        { id: 'list-1', title: 'To Do' },
        { id: 'list-2', title: 'In Progress' },
        { id: 'list-3', title: 'Done' }
      ]
    });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update board
router.put('/:id', async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete board
router.delete('/:id', async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ boardId: req.params.id });
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;