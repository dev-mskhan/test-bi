import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from './authController';
import { authenticate } from './authenticate';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
});

// POST /auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  ctrl.register
);

// POST /auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  ctrl.login
);

// POST /auth/refresh
router.post('/refresh', ctrl.refresh);

// POST /auth/logout
router.post('/logout', authenticate, ctrl.logout);

// GET /auth/me
router.get('/me', authenticate, ctrl.me);

// PUT /auth/password
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  ctrl.changePassword
);

// DELETE /auth/account
router.delete('/account', authenticate, ctrl.deleteAccount);

export default router;