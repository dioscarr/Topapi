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
 * /api/profiles/{user_id}:
 *   get:
 *     summary: Get profile by user ID
 *     tags: [Profiles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 *       404:
 *         description: Profile not found
 */
router.get('/:user_id',
  optionalAuth,
  [param('user_id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const { user_id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user_id)
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, Staff]
 *               language:
 *                 type: string
 *                 enum: [en, es]
 *     responses:
 *       201:
 *         description: Profile created successfully
 */
router.post('/',
  authenticate,
  [
    body('user_id').isUUID(),
    body('name').optional().trim(),
    body('role').optional().isIn(['Admin', 'admin', 'Staff', 'staff']),
    body('language').optional().isIn(['en', 'es']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { user_id, name, role, language } = req.body;

      // Verify that the authenticated user is creating their own profile
      if (req.user.id !== user_id) {
        throw new ApiError(403, 'Forbidden: You can only create your own profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id,
          name,
          role: (role || 'Staff').toLowerCase(),
          language: language || 'en',
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
 * /api/profiles/{user_id}:
 *   patch:
 *     summary: Update profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: user_id
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
 *                 enum: [Admin, Staff]
 *               language:
 *                 type: string
 *                 enum: [en, es]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/:user_id',
  authenticate,
  [
    param('user_id').isUUID(),
    body('name').optional().trim(),
    body('role').optional().isIn(['Admin', 'admin', 'Staff', 'staff']),
    body('language').optional().isIn(['en', 'es']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { user_id } = req.params;

      // Check if user is updating their own profile
      if (req.user.id !== user_id) {
        throw new ApiError(403, 'Forbidden: You can only update your own profile');
      }

      const { name, role, language } = req.body;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (role !== undefined) updates.role = role.toLowerCase();
      if (language !== undefined) updates.language = language;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user_id)
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
 * /api/profiles/{user_id}:
 *   delete:
 *     summary: Delete profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete('/:user_id',
  authenticate,
  [param('user_id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const { user_id } = req.params;

      // Check if user is deleting their own profile
      if (req.user.id !== user_id) {
        throw new ApiError(403, 'Forbidden: You can only delete your own profile');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user_id);

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
