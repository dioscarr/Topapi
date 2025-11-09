/**
 * User Routes
 * 
 * Handles user management operations
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
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get users from a users table (you'll need to create this in Supabase)
    const client = supabaseAdmin || supabase;
    const { data, error, count } = await client
      .from('users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApiError(400, error.message);
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.patch('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { id } = req.params;

      // Check if user is updating their own profile or is admin
      if (req.user.id !== id) {
        // You can add admin check here
        throw new ApiError(403, 'Forbidden: You can only update your own profile');
      }

      const { email, metadata } = req.body;
      const updates = {};

      if (email) updates.email = email;
      if (metadata) updates.metadata = metadata;

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const { id } = req.params;

      // Check if user is deleting their own profile or is admin
      if (req.user.id !== id) {
        throw new ApiError(403, 'Forbidden: You can only delete your own profile');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
