import express from 'express';
const stockRouter = express.Router();
import * as q from '../db/querys.js';
import { pool } from '../db/index.js';

stockRouter.get('/stock', async (req, res) => {
  try {
    const {
      plu,
      store_id,
      quantity_from,
      quantity_to,
      order_quantity_from,
      order_quantity_to,
    } = req.query;

    const filters = {};

    if (plu) filters.plu = parseInt(plu);
    if (store_id) filters.store_id = parseInt(store_id);
    if (quantity_from) filters.quantity_from = parseInt(quantity_from);
    if (quantity_to) filters.quantity_to = parseInt(quantity_to);
    if (order_quantity_from)
      filters.order_quantity_from = parseInt(order_quantity_from);
    if (order_quantity_to)
      filters.order_quantity_to = parseInt(order_quantity_to);

    const result = await q.getStockWithFilters(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock for specific shop
stockRouter.get('/stock/:storeId', async (req, res) => {
  const { storeId } = req.params;
  const result = await pool.query(
    `
    SELECT s.*, p.name as product_name 
    FROM stock s 
    JOIN products p ON s.product_id = p.plu 
    WHERE s.store_id = $1
  `,
    [storeId],
  );
  res.json(result.rows);
});

// Add or update stock
stockRouter.post('/stock', async (req, res) => {
  const { product_id, store_id, quantity, order_quantity } = req.body;

  const result = await pool.query(
    `
    INSERT INTO stock (product_id, store_id, quantity, order_quantity)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (product_id, store_id)
    DO UPDATE SET 
      quantity = $3,
      order_quantity = $4
    RETURNING *
  `,
    [product_id, store_id, quantity, order_quantity],
  );
  q.notifyHistoryService({
    action: `updated shop_id:${store_id} plu:${product_id} quantity:${quantity} oreder:${order_quantity}`,
    plu: product_id,
    shop_id: store_id,
    quantity,
    order_quantity,
  });
  res.json(result.rows[0]);
});

// Update stock quantities
stockRouter.put('/stock/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, order_quantity } = req.body;

  const result = await pool.query(
    `
    UPDATE stock 
    SET quantity = $1, order_quantity = $2
    WHERE id = $3
    RETURNING *
  `,
    [quantity, order_quantity, id],
  );
  res.json(result.rows[0]);
});

// Delete stock entry
stockRouter.delete('/stock/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM stock WHERE id = $1', [id]);
  res.json({ message: 'Stock entry deleted' });
});

stockRouter.get('/stock/:storeId/:productId', async (req, res) => {
  const { storeId, productId } = req.params;
  const result = await pool.query(
    `
    SELECT quantity, order_quantity 
    FROM stock 
    WHERE store_id = $1 AND product_id = $2
  `,
    [storeId, productId],
  );

  res.json(result.rows[0] || null);
});

export default stockRouter;
