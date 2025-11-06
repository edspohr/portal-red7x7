import request from 'supertest';
import createApp from '../src/app.js';

describe('Red7x7 API', () => {
  const app = createApp();

  it('responde al healthcheck', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
