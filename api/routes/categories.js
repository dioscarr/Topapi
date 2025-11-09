/**
 * Categories Routes
 *
 * Handles category management operations
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
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
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
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const department = req.query.department;

    let query = supabase
      .from('categories')
      .select(`
        id,
        department,
        name,
        created_at,
        created_by
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (department) {
      query = query.eq('department', department);
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
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category data
 *       404:
 *         description: Category not found
 */
router.get('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid category ID');
      }

      const { id } = req.params;

      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          department,
          name,
          created_at,
          created_by
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'Category not found');
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
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *               - name
 *             properties:
 *               department:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/',
  authenticate,
  requireAdmin,
  [
    body('department').trim().notEmpty(),
    body('name').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { department, name } = req.body;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          department,
          name,
          created_by: req.user.id,
        })
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update category
 *     tags: [Categories]
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
 *               department:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.patch('/:id',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID(),
    body('department').optional().trim().notEmpty(),
    body('name').optional().trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { id } = req.params;
      const { department, name } = req.body;

      const updates = {};
      if (department !== undefined) updates.department = department;
      if (name !== undefined) updates.name = name;

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid category ID');
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;