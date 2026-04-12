const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  listId: { type: String, required: true },
  assignee: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date },
  attachments: [{ url: String, publicId: String, name: String }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);