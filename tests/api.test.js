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
        expect(res.
