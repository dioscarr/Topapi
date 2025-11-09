/**
 * Activity Log Routes
 *
 * Handles activity logging operations
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Activity Log
 *   description: Activity logging endpoints
 */

/**
 * @swagger
 * /api/activity-log:
 *   get:
 *     summary: Get activity log entries
 *     tags: [Activity Log]
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
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, deleted]
 *     responses:
 *       200:
 *         description: List of activity log entries
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.query.user_id;
    const action = req.query.action;

    let query = supabase
      .from('activity_log')
      .select(`
        id,
        user_id,
        action,
        item_id,
        item_name,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

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
 * /api/activity-log/{id}:
 *   get:
 *     summary: Get activity log entry by ID
 *     tags: [Activity Log]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity log entry data
 *       404:
 *         description: Entry not found
 */
router.get('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid activity log ID');
      }

      const { id } = req.params;

      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          action,
          item_id,
          item_name,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'Activity log entry not found');
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
 * /api/activity-log:
 *   post:
 *     summary: Create a new activity log entry
 *     tags: [Activity Log]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - item_name
 *             properties:
 *               user_id:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [created, updated, deleted]
 *               item_id:
 *                 type: string
 *               item_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity log entry created successfully
 */
router.post('/',
  authenticate,
  [
    body('action').isIn(['created', 'updated', 'deleted']),
    body('item_name').trim().notEmpty(),
    body('user_id').optional().isUUID(),
    body('item_id').optional().isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { user_id, action, item_id, item_name } = req.body;

      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          user_id: user_id || req.user.id,
          action,
          item_id,
          item_name,
        })
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.status(201).json({
        success: true,
        message: 'Activity log entry created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/activity-log/{id}:
 *   delete:
 *     summary: Delete activity log entry
 *     tags: [Activity Log]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity log entry deleted successfully
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid activity log ID');
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('activity_log')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Activity log entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;