/**
 * Authentication Routes 
 * 
 * Handles user authentication including signup, login, logout, and token refresh
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { admin: supabaseAdmin } = require('../utils/supabase');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user (Admin only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/signup',
  authenticate, 
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { email, password, metadata } = req.body;

      // Normalize role to lowercase
      const normalizedMetadata = {
        ...metadata,
        role: (metadata?.role || 'Staff').toLowerCase(),
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: normalizedMetadata,
        },
      });

      if (error) {
        throw new ApiError(400, error.message);
      }

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name: normalizedMetadata.name || null,
          role: normalizedMetadata.role,
          language: normalizedMetadata.language || 'en',
        });

      if (profileError) {
        // If profile creation fails, we should clean up by deleting the user
        console.error('Failed to create profile:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        throw new ApiError(500, 'Failed to create user profile. User account has been cleaned up.');
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: data.user,
          session: data.session,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new ApiError(401, error.message);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: data.user,
          session: data.session,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new ApiError(400, error.message);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh',
  [body('refresh_token').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { refresh_token } = req.body;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        throw new ApiError(401, error.message);
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          session: data.session,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/reset-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { email } = req.body;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/update-password:
 *   post:
 *     summary: Update password (requires authentication)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post('/update-password',
  authenticate,
  [body('password').isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { password } = req.body;

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/admin/reset-password/{userId}:
 *   post:
 *     summary: Admin reset user password (Admin only)
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       403:
 *         description: Admin access required
 */
router.post('/admin/reset-password/:userId',
  authenticate,
  requireAdmin,
  [
    param('userId').isUUID(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { userId } = req.params;
      const { password } = req.body;

      // Use admin client to update another user's password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
