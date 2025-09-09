const Dog = require('../models/Dog');
const mongoose = require('mongoose');

// Register a dog for adoption
const registerDog = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({ message: 'Dog name cannot be empty' });
    }

    if (description.trim().length === 0) {
      return res.status(400).json({ message: 'Dog description cannot be empty' });
    }

    const dog = new Dog({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id
    });

    await dog.save();

    res.status(201).json({
      message: 'Dog registered successfully',
      dog: {
        id: dog._id,
        name: dog.name,
        description: dog.description,
        status: dog.status,
        createdAt: dog.createdAt
      }
    });
  } catch (error) {
    console.error('Dog registration error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Dog registration failed' });
  }
};

// Adopt a dog
const adoptDog = async (req, res) => {
  try {
    const { dogId } = req.params;
    const { thankYouMessage } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(dogId)) {
      return res.status(400).json({ message: 'Invalid dog ID' });
    }

    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }

    // Check if dog is already adopted
    if (dog.status === 'adopted') {
      return res.status(400).json({ message: 'Dog is already adopted' });
    }

    // Check if user is trying to adopt their own dog
    if (dog.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot adopt your own dog' });
    }

    // Update dog with adoption details
    dog.status = 'adopted';
    dog.adopter = req.user._id;
    dog.adoptionDate = new Date();
    if (thankYouMessage && thankYouMessage.trim()) {
      dog.adoptionMessage = thankYouMessage.trim();
    }

    await dog.save();

    await dog.populate('owner', 'username');

    res.status(200).json({
      message: 'Dog adopted successfully',
      dog: {
        id: dog._id,
        name: dog.name,
        description: dog.description,
        status: dog.status,
        owner: dog.owner.username,
        adoptionMessage: dog.adoptionMessage,
        adoptionDate: dog.adoptionDate
      }
    });
  } catch (error) {
    console.error('Dog adoption error:', error);
    res.status(500).json({ message: 'Dog adoption failed' });
  }
};

// Remove a dog (only by owner and only if not adopted)
const removeDog = async (req, res) => {
  try {
    const { dogId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(dogId)) {
      return res.status(400).json({ message: 'Invalid dog ID' });
    }

    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }

    // Check if user is the owner
    if (dog.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only remove dogs you registered' });
    }

    // Check if dog is already adopted
    if (dog.status === 'adopted') {
      return res.status(400).json({ message: 'Cannot remove adopted dog' });
    }

    await Dog.findByIdAndDelete(dogId);

    res.status(200).json({ message: 'Dog removed successfully' });
  } catch (error) {
    console.error('Dog removal error:', error);
    res.status(500).json({ message: 'Dog removal failed' });
  }
};

// List dogs registered by the user
const listRegisteredDogs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Build filter
    const filter = { owner: req.user._id };
    if (status && ['available', 'adopted'].includes(status)) {
      filter.status = status;
    }

    const total = await Dog.countDocuments(filter);
    const dogs = await Dog.find(filter)
      .populate('adopter', 'username')
      .select('name description status adoptionDate adoptionMessage createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      dogs: dogs.map(dog => ({
        id: dog._id,
        name: dog.name,
        description: dog.description,
        status: dog.status,
        adopter: dog.adopter ? dog.adopter.username : null,
        adoptionMessage: dog.adoptionMessage || null,
        adoptionDate: dog.adoptionDate || null,
        createdAt: dog.createdAt
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('List registered dogs error:', error);
    res.status(500).json({ message: 'Failed to fetch registered dogs' });
  }
};

// List dogs adopted by the user
const listAdoptedDogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const filter = { adopter: req.user._id, status: 'adopted' };

    const total = await Dog.countDocuments(filter);
    const dogs = await Dog.find(filter)
      .populate('owner', 'username')
      .select('name description adoptionDate adoptionMessage createdAt')
      .sort({ adoptionDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      dogs: dogs.map(dog => ({
        id: dog._id,
        name: dog.name,
        description: dog.description,
        originalOwner: dog.owner.username,
        adoptionMessage: dog.adoptionMessage || null,
        adoptionDate: dog.adoptionDate
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('List adopted dogs error:', error);
    res.status(500).json({ message: 'Failed to fetch adopted dogs' });
  }
};

module.exports = {
  registerDog,
  adoptDog,
  removeDog,
  listRegisteredDogs,
  listAdoptedDogs
};
