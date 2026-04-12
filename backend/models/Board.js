const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  owner: { type: String, required: true },
  members: [{ type: String }],
  lists: [{
    id: { type: String, required: true },
    title: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);