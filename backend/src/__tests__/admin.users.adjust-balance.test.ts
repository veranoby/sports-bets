import request from 'supertest';
import express from 'express';
import { transaction, sequelize } from '../config/database'; // Import transaction and sequelize
import { User, Wallet, Transaction } from '../models'; // Import models
import router from '../routes/users'; // Import the router that contains the endpoint
import authRouter from '../routes/auth'; // Import auth router for admin login
import { sign } from 'jsonwebtoken';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.test for testing
config({ path: '.env.test' });

const app = express();
app.use(express.json());
app.use('/api/users', router); // Mount the users router
app.use('/api/auth', authRouter); // Mount the auth router for login

// Mock user for testing
interface TestUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin" | "operator" | "venue" | "gallera";
  token?: string;
}

let adminUser: TestUser;
let regularUser: TestUser;
let adminToken: string;
let regularUserToken: string;

beforeAll(async () => {
  // Ensure database is clean before tests
  await sequelize.sync({ force: true });

  // Create test admin user
  adminUser = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e6', // Unique ID
    username: 'adminTest',
    email: 'admin@test.com',
    passwordHash: await bcrypt.hash('AdminPass123', 10),
    role: 'admin',
  };
  await User.create(adminUser);
  adminToken = sign({ userId: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  // Create test regular user
  regularUser = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e7', // Unique ID
    username: 'userTest',
    email: 'user@test.com',
    passwordHash: await bcrypt.hash('UserPass123', 10),
    role: 'user',
  };
  await User.create(regularUser);
  regularUserToken = sign({ userId: regularUser.id, role: regularUser.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  // Create a wallet for the regular user
  await Wallet.create({ userId: regularUser.id, balance: 100.00, frozenAmount: 0 });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/admin/users/:userId/adjust-balance', () => {
  it('should allow an admin to credit a user\'s wallet', async () => {
    const initialBalance = (await Wallet.findOne({ where: { userId: regularUser.id } }))?.balance || 0;
    const adjustmentAmount = 50.00;
    const reason = 'Bonus por buen desempeño.';

    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'credit', amount: adjustmentAmount, reason });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('adjusted successfully');

    // Verify wallet balance in DB
    const updatedWallet = await Wallet.findOne({ where: { userId: regularUser.id } });
    expect(updatedWallet?.balance).toBe(Number(initialBalance) + adjustmentAmount);

    // Verify transaction record in DB
    const transactionRecord = await Transaction.findOne({
      where: {
        walletId: updatedWallet?.id,
        type: 'admin_credit',
        amount: adjustmentAmount,
        status: 'completed',
      },
    });
    expect(transactionRecord).not.toBeNull();
    expect(transactionRecord?.metadata).toMatchObject({ adminId: adminUser.id, reason });
  });

  it('should allow an admin to debit a user\'s wallet', async () => {
    const initialBalance = (await Wallet.findOne({ where: { userId: regularUser.id } }))?.balance || 0;
    const adjustmentAmount = 20.00;
    const reason = 'Corrección por error de depósito.';

    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'debit', amount: adjustmentAmount, reason });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('adjusted successfully');

    const updatedWallet = await Wallet.findOne({ where: { userId: regularUser.id } });
    expect(updatedWallet?.balance).toBe(Number(initialBalance) - adjustmentAmount);

    const transactionRecord = await Transaction.findOne({
      where: {
        walletId: updatedWallet?.id,
        type: 'admin_debit',
        amount: adjustmentAmount,
        status: 'completed',
      },
    });
    expect(transactionRecord).not.toBeNull();
    expect(transactionRecord?.metadata).toMatchObject({ adminId: adminUser.id, reason });
  });

  it('should prevent debiting a user\'s wallet with insufficient funds', async () => {
    // Set user\'s balance to a low amount for this test
    await Wallet.update({ balance: 5.00 }, { where: { userId: regularUser.id } });
    const adjustmentAmount = 10.00;
    const reason = 'Intento de débito con fondos insuficientes.';

    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'debit', amount: adjustmentAmount, reason });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient balance for debit adjustment');

    // Verify balance has not changed
    const updatedWallet = await Wallet.findOne({ where: { userId: regularUser.id } });
    expect(updatedWallet?.balance).toBe(5.00); // Should remain the low balance
  });

  it('should not allow a regular user to adjust wallet balance', async () => {
    const adjustmentAmount = 10.00;
    const reason = 'Intento de ajuste por usuario regular.';

    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ type: 'credit', amount: adjustmentAmount, reason });

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient permissions');
  });

  it('should return 400 for invalid input (e.g., missing amount)', async () => {
    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'credit', reason: 'Missing amount' }); // Missing amount

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Amount must be a positive number');
  });

  it('should return 400 for invalid input (e.g., reason too short)', async () => {
    const res = await request(app)
      .post(`/api/users/${regularUser.id}/adjust-balance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'credit', amount: 10.00, reason: 'Short' }); // Reason too short

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Reason must be between 10 and 255 characters');
  });
});
