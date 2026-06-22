import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function encodeCursor(product) {
  return Buffer.from(
    JSON.stringify({
      created_at: product.created_at,
      id: product.id,
    })
  ).toString('base64');
}

function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed.created_at !== 'string' || typeof parsed.id !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { category, cursor, limit } = req.query;
    const parsedLimit = limit === undefined ? 20 : Number.parseInt(limit, 10);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ error: 'limit must be a positive integer' });
    }

    const cappedLimit = Math.min(parsedLimit, 100);
    const whereClauses = [];
    const values = [];

    if (typeof category === 'string' && category.trim()) {
      values.push(category.trim());
      whereClauses.push(`category = $${values.length}`);
    }

    let cursorData = null;
    if (typeof cursor === 'string' && cursor.trim()) {
      cursorData = decodeCursor(cursor.trim());

      if (!cursorData) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }

      values.push(cursorData.created_at, cursorData.id);
      whereClauses.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`);
    }

    values.push(cappedLimit + 1);

    const queryParts = ['SELECT id, name, category, price, created_at, updated_at FROM products'];

    if (whereClauses.length > 0) {
      queryParts.push(`WHERE ${whereClauses.join(' AND ')}`);
    }

    queryParts.push(`ORDER BY created_at DESC, id DESC LIMIT $${values.length}`);

    const { rows } = await pool.query(queryParts.join(' '), values);

    const hasNextPage = rows.length > cappedLimit;
    const products = hasNextPage ? rows.slice(0, cappedLimit) : rows;
    const nextCursor = hasNextPage && products.length > 0 ? encodeCursor(products[products.length - 1]) : null;

    res.json({
      products,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
