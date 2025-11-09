/**
 * Inventory Routes
 *
 * Handles inventory management operations
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
 *   name: Inventory
 *   description: Inventory management endpoints
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        department,
        category,
        quantity,
        min_quantity,
        unit,
        description,
        created_at,
        created_by
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
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
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item data
 *       404:
 *         description: Item not found
 */
router.get('/:id',
  authenticate,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid item ID');
      }

      const { id } = req.params;

      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          department,
          category,
          quantity,
          min_quantity,
          unit,
          description,
          created_at,
          created_by
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'Inventory item not found');
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
 * /api/inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - department
 *               - category
 *               - quantity
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               category:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               min_quantity:
 *                 type: integer
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post('/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('department').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('min_quantity').optional().isInt({ min: 0 }),
    body('unit').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { name, department, category, quantity, min_quantity, unit, description } = req.body;

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          name,
          department,
          category,
          quantity,
          min_quantity,
          unit,
          description,
          created_by: req.user.id,
        })
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/inventory/{id}:
 *   patch:
 *     summary: Update inventory item
 *     tags: [Inventory]
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
 *               department:
 *                 type: string
 *               category:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               min_quantity:
 *                 type: integer
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.patch('/:id',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('quantity').optional().isInt({ min: 0 }),
    body('min_quantity').optional().isInt({ min: 0 }),
    body('unit').optional().trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', true, JSON.stringify(errors.array()));
      }

      const { id } = req.params;
      const { name, department, category, quantity, min_quantity, unit, description } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (department !== undefined) updates.department = department;
      if (category !== undefined) updates.category = category;
      if (quantity !== undefined) updates.quantity = quantity;
      if (min_quantity !== undefined) updates.min_quantity = min_quantity;
      if (unit !== undefined) updates.unit = unit;
      if (description !== undefined) updates.description = description;

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Inventory item updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid item ID');
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(400, error.message);
      }

      res.json({
        success: true,
        message: 'Inventory item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;