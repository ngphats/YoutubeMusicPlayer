process.env.SERVER_PORT = 3001;

const request = require('supertest');
const app = require('../app');

describe('GET /test', () => {
  it('responds with 200', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
  });
});
