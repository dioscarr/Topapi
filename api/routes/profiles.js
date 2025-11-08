/**
 * Profile Routes
 * 
 * Handles user profile management operations
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get all profiles
 *     tags: [Profiles]
 *     security: []
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
 *         description: List of profiles
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('profiles')
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
 * /api/profiles/{id}:
 *   get:
 *     summary: Get profile by ID
 *     tags: [Profiles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 *       404:
 *         description: Profile not found
 */
router.get('/:id',
  optionalAuth,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid profile ID');
      }

      const { id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'Profile not found');
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
 * /api/profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created successfully
 */
router.post('/',
  authenticate,
  [
    body('user_id').isUUID(),
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('full_name').optional().trim(),
    body('avatar_url').optional().isURL(),
    body('bio').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { user_id, username, full_name, avatar_url, bio } = req.body;

      // Verify that the authenticated user is creating their own profile
      if (req.user.id !== user_id) {
        throw new ApiError(403, 'Forbidden: You can only create your own profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user_id,
          username,
          full_name,
          avatar_url,
          bio,
        })
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/profiles/{id}:
 *   patch:
 *     summary: Update profile
 *     tags: [Profiles]
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
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('full_name').optional().trim(),
    body('avatar_url').optional().isURL(),
    body('bio').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { id } = req.params;

      // Check if user is updating their own profile
      if (req.user.id !== id) {
        throw new ApiError(403, 'Forbidden: You can only update your own profile');
      }

      const { username, full_name, avatar_url, bio } = req.body;
      const updates = {};

      if (username !== undefined) updates.username = username;
      if (full_name !== undefined) updates.full_name = full_name;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (bio !== undefined) updates.bio = bio;

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/profiles/{id}:
 *   delete:
 *     summary: Delete profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid profile ID');
      }

      const { id } = req.params;

      // Check if user is deleting their own profile
      if (req.user.id !== id) {
        throw new ApiError(403, 'Forbidden: You can only delete your own profile');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
