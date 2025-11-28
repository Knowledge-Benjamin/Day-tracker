const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../database/db');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schema
const goalSchema = Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('', null),
    startDate: Joi.date().required(),
    durationDays: Joi.number().integer().min(1).required(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
    clientId: Joi.string().uuid()
});

// Get all goals for user
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT 
        id, 
        title, 
        description, 
        start_date, 
        duration_days, 
        end_date,
        color,
        is_active,
        created_at,
        updated_at,
        client_id,
        (SELECT COUNT(*) FROM daily_logs WHERE goal_id = goals.id AND deleted_at IS NULL) as logged_days
      FROM goals 
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`,
            [req.user.id]
        );

        const goals = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            startDate: row.start_date,
            durationDays: row.duration_days,
            endDate: row.end_date,
            color: row.color,
            isActive: row.is_active,
            loggedDays: parseInt(row.logged_days),
            progress: (parseInt(row.logged_days) / row.duration_days) * 100,
            daysRemaining: row.duration_days - parseInt(row.logged_days),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            clientId: row.client_id
        }));

        res.json({
            success: true,
            data: goals
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching goals'
        });
    }
});

// Get single goal by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT 
        id, 
        title, 
        description, 
        start_date, 
        duration_days, 
        end_date,
        color,
        is_active,
        created_at,
        updated_at,
        client_id,
        (SELECT COUNT(*) FROM daily_logs WHERE goal_id = goals.id AND deleted_at IS NULL) as logged_days
      FROM goals 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        const row = result.rows[0];
        const goal = {
            id: row.id,
            title: row.title,
            description: row.description,
            startDate: row.start_date,
            durationDays: row.duration_days,
            endDate: row.end_date,
            color: row.color,
            isActive: row.is_active,
            loggedDays: parseInt(row.logged_days),
            progress: (parseInt(row.logged_days) / row.duration_days) * 100,
            daysRemaining: row.duration_days - parseInt(row.logged_days),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            clientId: row.client_id
        };

        res.json({
            success: true,
            data: goal
        });
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching goal'
        });
    }
});

// Create new goal
router.post('/', async (req, res) => {
    try {
        const { error, value } = goalSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { title, description, startDate, durationDays, color, clientId } = value;

        const result = await query(
            `INSERT INTO goals (user_id, title, description, start_date, duration_days, color, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, start_date, duration_days, end_date, color, is_active, created_at, client_id`,
            [req.user.id, title, description || null, startDate, durationDays, color, clientId || null]
        );

        const goal = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Goal created successfully',
            data: {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                startDate: goal.start_date,
                durationDays: goal.duration_days,
                endDate: goal.end_date,
                color: goal.color,
                isActive: goal.is_active,
                loggedDays: 0,
                progress: 0,
                daysRemaining: goal.duration_days,
                createdAt: goal.created_at,
                clientId: goal.client_id
            }
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating goal'
        });
    }
});

// Update goal
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = goalSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { title, description, startDate, durationDays, color } = value;

        const result = await query(
            `UPDATE goals 
       SET title = $1, description = $2, start_date = $3, duration_days = $4, color = $5
       WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
       RETURNING id, title, description, start_date, duration_days, end_date, color, is_active, updated_at, client_id`,
            [title, description || null, startDate, durationDays, color, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        const goal = result.rows[0];

        res.json({
            success: true,
            message: 'Goal updated successfully',
            data: {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                startDate: goal.start_date,
                durationDays: goal.duration_days,
                endDate: goal.end_date,
                color: goal.color,
                isActive: goal.is_active,
                updatedAt: goal.updated_at,
                clientId: goal.client_id
            }
        });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating goal'
        });
    }
});

// Delete goal (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const result = await query(
            `UPDATE goals 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting goal'
        });
    }
});

// Toggle goal active status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const result = await query(
            `UPDATE goals 
       SET is_active = NOT is_active 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, is_active`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        res.json({
            success: true,
            message: 'Goal status toggled',
            data: {
                id: result.rows[0].id,
                isActive: result.rows[0].is_active
            }
        });
    } catch (error) {
        console.error('Toggle goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling goal status'
        });
    }
});

module.exports = router;
