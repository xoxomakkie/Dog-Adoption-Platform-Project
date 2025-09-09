const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  registerDog,
  adoptDog,
  removeDog,
  listRegisteredDogs,
  listAdoptedDogs
} = require('../controllers/dogController');

// All routes require authentication
router.use(authenticateToken);

// POST /api/dogs - Register a dog for adoption
router.post('/', registerDog);

// POST /api/dogs/:dogId/adopt - Adopt a dog
router.post('/:dogId/adopt', adoptDog);

// DELETE /api/dogs/:dogId - Remove a dog
router.delete('/:dogId', removeDog);

// GET /api/dogs/registered - List dogs registered by user
router.get('/registered', listRegisteredDogs);

// GET /api/dogs/adopted - List dogs adopted by user
router.get('/adopted', listAdoptedDogs);

module.exports = router;
