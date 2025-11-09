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
 *         description: List of users with profile information
 */
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get users by joining profiles with auth.users for complete user data
    const client = supabaseAdmin || supabase;
    
    const { data, error, count } = await client
      .from('profiles')
      .select(`
        user_id,
        name,
        role,
        language,
        created_at,
        updated_at
      `, { count: 'exact' })
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
 *         description: User profile data
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
        .from('profiles')
        .select(`
          user_id,
          name,
          role,
          language,
          created_at,
          updated_at
        `)
        .eq('user_id', id)
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
 *     summary: Update user profile
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 */
router.patch('/:id',
  authenticate,
  [
    param('id').isUUID(),
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
        // Check if current user is admin
        const isAdmin = req.user.user_metadata && req.user.user_metadata.role === 'admin';
        const allowedUserIds = ['b0277918-05c5-4892-bf45-c5f66a98eab6']; // dioscarr@gmail.com
        const isAllowedUser = allowedUserIds.includes(req.user.id);
        
        if (!isAdmin && !isAllowedUser) {
          throw new ApiError(403, 'Forbidden: You can only update your own profile or need admin access');
        }
      }

      const { name, role, language } = req.body;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (role !== undefined) updates.role = role;
      if (language !== undefined) updates.language = language;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'User profile updated successfully',
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
 *     summary: Delete user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile deleted successfully
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
        // Check if current user is admin
        const isAdmin = req.user.user_metadata && req.user.user_metadata.role === 'admin';
        const allowedUserIds = ['b0277918-05c5-4892-bf45-c5f66a98eab6']; // dioscarr@gmail.com
        const isAllowedUser = allowedUserIds.includes(req.user.id);
        
        if (!isAdmin && !isAllowedUser) {
          throw new ApiError(403, 'Forbidden: You can only delete your own profile or need admin access');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'User profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
