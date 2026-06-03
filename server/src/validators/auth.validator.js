import { body } from 'express-validator';

const strongPassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[a-z]/)
  .withMessage('Password needs a lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password needs an uppercase letter')
  .matches(/\d/)
  .withMessage('Password needs a number');

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPassword,
  body('role').optional().isIn(['student', 'teacher']).withMessage('Invalid role'),
];

export const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password needs an uppercase letter')
    .matches(/\d/)
    .withMessage('Password needs a number'),
];

// OTP-based reset: email + 6-digit code + new strong password.
export const resetOtpRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Enter the 6-digit code')
    .isNumeric()
    .withMessage('The code must be 6 digits'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password needs an uppercase letter')
    .matches(/\d/)
    .withMessage('Password needs a number'),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password needs an uppercase letter')
    .matches(/\d/)
    .withMessage('Password needs a number'),
];
