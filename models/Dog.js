const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dog name is required'],
    trim: true,
    maxlength: [50, 'Dog name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Dog description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adoptionMessage: {
    type: String,
    trim: true,
    maxlength: [200, 'Adoption message cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['available', 'adopted'],
    default: 'available'
  },
  adoptionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
dogSchema.index({ owner: 1, status: 1 });
dogSchema.index({ adopter: 1 });

module.exports = mongoose.model('Dog', dogSchema);
