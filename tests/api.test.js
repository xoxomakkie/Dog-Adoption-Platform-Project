const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const User = require('../models/User');
const Dog = require('../models/Dog');

chai.use(chaiHttp);
const { expect } = chai;

describe('Dog Adoption Platform API', () => {
  let userToken;
  let secondUserToken;
  let userId;
  let secondUserId;
  let dogId;

  // Clean up database before tests
  before(async () => {
    await User.deleteMany({});
    await Dog.deleteMany({});
  });

  // Clean up after tests
  after(async () => {
    await User.deleteMany({});
    await Dog.deleteMany({});
  });

  describe('User Authentication', () => {
    describe('POST /api/users/register', () => {
      it('should register a new user successfully', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'testuser1',
            password: 'password123'
          });

        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'User registered successfully');
        expect(res.body.user).to.have.property('username', 'testuser1');
        userId = res.body.user.id;
      });

      it('should register a second user for testing', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'testuser2',
            password: 'password456'
          });

        expect(res).to.have.status(201);
        secondUserId = res.body.user.id;
      });

      it('should fail to register with duplicate username', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'testuser1',
            password: 'password123'
          });

        expect(res).to.have.status(409);
        expect(res.body).to.have.property('message', 'Username already exists');
      });

      it('should fail to register with missing fields', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'testuser3'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Username and password are required');
      });

      it('should fail to register with short username', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'ab',
            password: 'password123'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Username must be at least 3 characters long');
      });

      it('should fail to register with short password', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/register')
          .send({
            username: 'testuser4',
            password: '12345'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Password must be at least 6 characters long');
      });
    });

    describe('POST /api/users/login', () => {
      it('should login successfully with correct credentials', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser1',
            password: 'password123'
          });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Login successful');
        expect(res.body).to.have.property('token');
        expect(res.body.user).to.have.property('username', 'testuser1');
        userToken = res.body.token;
      });

      it('should login second user', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser2',
            password: 'password456'
          });

        expect(res).to.have.status(200);
        secondUserToken = res.body.token;
      });

      it('should fail to login with incorrect password', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser1',
            password: 'wrongpassword'
          });

        expect(res).to.have.status(401);
        expect(res.body).to.have.property('message', 'Invalid credentials');
      });

      it('should fail to login with non-existent username', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/login')
          .send({
            username: 'nonexistent',
            password: 'password123'
          });

        expect(res).to.have.status(401);
        expect(res.body).to.have.property('message', 'Invalid credentials');
      });

      it('should fail to login with missing fields', async () => {
        const res = await chai
          .request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser1'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Username and password are required');
      });
    });
  });

  describe('Dog Management', () => {
    describe('POST /api/dogs', () => {
      it('should register a dog successfully', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Buddy',
            description: 'A friendly golden retriever looking for a loving home'
          });

        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'Dog registered successfully');
        expect(res.body.dog).to.have.property('name', 'Buddy');
        expect(res.body.dog).to.have.property('status', 'available');
        dogId = res.body.dog.id;
      });

      it('should fail to register dog without authentication', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs')
          .send({
            name: 'Max',
            description: 'A playful dog'
          });

        expect(res).to.have.status(401);
        expect(res.body).to.have.property('message', 'Access token required');
      });

      it('should fail to register dog with missing fields', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Max'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Name and description are required');
      });

      it('should fail to register dog with empty name', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: '   ',
            description: 'A playful dog'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Dog name cannot be empty');
      });
    });

    describe('POST /api/dogs/:dogId/adopt', () => {
      it('should adopt a dog successfully', async () => {
        const res = await chai
          .request(app)
          .post(`/api/dogs/${dogId}/adopt`)
          .set('Authorization', `Bearer ${secondUserToken}`)
          .send({
            thankYouMessage: 'Thank you for taking care of Buddy!'
          });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Dog adopted successfully');
        expect(res.body.dog).to.have.property('status', 'adopted');
        expect(res.body.dog).to.have.property('adoptionMessage', 'Thank you for taking care of Buddy!');
      });

      it('should fail to adopt already adopted dog', async () => {
        const res = await chai
          .request(app)
          .post(`/api/dogs/${dogId}/adopt`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            thankYouMessage: 'Another adoption attempt'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Dog is already adopted');
      });

      it('should fail to adopt non-existent dog', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs/507f1f77bcf86cd799439011/adopt')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            thankYouMessage: 'Thank you!'
          });

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Dog not found');
      });

      it('should fail to adopt with invalid dog ID', async () => {
        const res = await chai
          .request(app)
          .post('/api/dogs/invalid-id/adopt')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            thankYouMessage: 'Thank you!'
          });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Invalid dog ID');
      });
    });

    describe('DELETE /api/dogs/:dogId', () => {
      let removableDogId;

      before(async () => {
        // Create a dog that can be removed
        const res = await chai
          .request(app)
          .post('/api/dogs')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Charlie',
            description: 'A dog that will be removed'
          });
        removableDogId = res.body.dog.id;
      });

      it('should fail to remove adopted dog', async () => {
        const res = await chai
          .request(app)
          .delete(`/api/dogs/${dogId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Cannot remove adopted dog');
      });

      it('should fail to remove dog registered by another user', async () => {
        const res = await chai
          .request(app)
          .delete(`/api/dogs/${removableDogId}`)
          .set('Authorization', `Bearer ${secondUserToken}`);

        expect(res).to.have.status(403);
        expect(res.body).to.have.property('message', 'You can only remove dogs you registered');
      });

      it('should remove dog successfully', async () => {
        const res = await chai
          .request(app)
          .delete(`/api/dogs/${removableDogId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Dog removed successfully');
      });

      it('should fail to remove non-existent dog', async () => {
        const res = await chai
          .request(app)
          .delete('/api/dogs/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Dog not found');
      });
    });

    describe('GET /api/dogs/registered', () => {
      before(async () => {
        // Create multiple dogs for pagination testing
        for (let i = 1; i <= 5; i++) {
          await chai
            .request(app)
            .post('/api/dogs')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: `TestDog${i}`,
              description: `Description for test dog ${i}`
            });
        }
      });

      it('should list registered dogs successfully', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/registered')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('dogs').that.is.an('array');
        expect(res.body).to.have.property('pagination');
        expect(res.body.pagination).to.have.property('currentPage', 1);
        expect(res.body.pagination).to.have.property('totalPages');
      });

      it('should filter dogs by status', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/registered?status=available')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(200);
        expect(res.body.dogs).to.be.an('array');
        res.body.dogs.forEach(dog => {
          expect(dog.status).to.equal('available');
        });
      });

      it('should support pagination', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/registered?page=1&limit=2')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(200);
        expect(res.body.dogs).to.have.lengthOf.at.most(2);
        expect(res.body.pagination).to.have.property('currentPage', 1);
      });

      it('should fail without authentication', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/registered');

        expect(res).to.have.status(401);
      });
    });

    describe('GET /api/dogs/adopted', () => {
      it('should list adopted dogs successfully', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/adopted')
          .set('Authorization', `Bearer ${secondUserToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('dogs').that.is.an('array');
        expect(res.body).to.have.property('pagination');
        
        // Should have at least one adopted dog (Buddy)
        expect(res.body.dogs.length).to.be.at.least(1);
        
        res.body.dogs.forEach(dog => {
          expect(dog).to.have.property('originalOwner');
          expect(dog).to.have.property('adoptionDate');
        });
      });

      it('should support pagination for adopted dogs', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/adopted?page=1&limit=5')
          .set('Authorization', `Bearer ${secondUserToken}`);

        expect(res).to.have.status(200);
        expect(res.body.pagination).to.have.property('currentPage', 1);
      });

      it('should return empty list for user with no adopted dogs', async () => {
        const res = await chai
          .request(app)
          .get('/api/dogs/adopted')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(200);
        expect(res.body.dogs).to.be.an('array').that.is.empty;
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid JWT token', async () => {
      const res = await chai
        .request(app)
        .get('/api/dogs/registered')
        .set('Authorization', 'Bearer invalid-token');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message', 'Invalid token');
    });

    it('should handle missing authorization header', async () => {
      const res = await chai
        .request(app)
        .get('/api/dogs/registered');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should handle non-existent routes', async () => {
      const res = await chai
        .request(app)
        .get('/api/nonexistent');

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('message', 'Route not found');
    });

    it('should handle health check', async () => {
      const res = await chai
        .request(app)
        .get('/health');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Dog Adoption Platform API is running!');
    });
  });

  describe('Business Logic Edge Cases', () => {
    let ownDogId;

    before(async () => {
      // Create a dog for testing self-adoption
      const res = await chai
        .request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'SelfAdoptTest',
          description: 'A dog for testing self-adoption prevention'
        });
      ownDogId = res.body.dog.id;
    });

    it('should prevent user from adopting their own dog', async () => {
      const res = await chai
        .request(app)
        .post(`/api/dogs/${ownDogId}/adopt`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          thankYouMessage: 'Trying to adopt my own dog'
        });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'You cannot adopt your own dog');
    });

    it('should handle adoption without thank you message', async () => {
      const res = await chai
        .request(app)
        .post(`/api/dogs/${ownDogId}/adopt`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({});

      expect(res).to.have.status(200);
      expect(res.body.dog).to.have.property('adoptionMessage').that.is.null;
    });
  });

  describe('Additional Validation Tests', () => {
    it('should handle extremely long dog names', async () => {
      const longName = 'A'.repeat(100);
      const res = await chai
        .request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: longName,
          description: 'Valid description'
        });

      expect(res).to.have.status(400);
    });

    it('should handle extremely long descriptions', async () => {
      const longDescription = 'A'.repeat(600);
      const res = await chai
        .request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'ValidName',
          description: longDescription
        });

      expect(res).to.have.status(400);
    });

    it('should handle invalid pagination parameters', async () => {
      const res = await chai
        .request(app)
        .get('/api/dogs/registered?page=0&limit=-5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res).to.have.status(200);
      expect(res.body.pagination.currentPage).to.equal(1);
    });

    it('should handle large pagination limit', async () => {
      const res = await chai
        .request(app)
        .get('/api/dogs/registered?limit=1000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res).to.have.status(200);
      // Should cap at maximum limit (50)
      expect(res.body.dogs.length).to.be.at.most(50);
    });
  });
});
