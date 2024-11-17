import express from 'express';
const stockRouter = express.Router();
import * as q from '../db/querys.js';
import { pool } from '../db/index.js';



stockRouter.get('/stock', async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, p.name as product_name, st.name as store_name 
    FROM stock s 
    JOIN products p ON s.product_id = p.plu 
    JOIN stores st ON s.store_id = st.id
  `)
  res.json(result.rows)
})

// Get stock for specific shop
stockRouter.get('/stock/:storeId', async (req, res) => {
  const { storeId } = req.params
  const result = await pool.query(`
    SELECT s.*, p.name as product_name 
    FROM stock s 
    JOIN products p ON s.product_id = p.plu 
    WHERE s.store_id = $1
  `, [storeId])
  res.json(result.rows)
})

// Add or update stock
stockRouter.post('/stock', async (req, res) => {
  const { product_id, store_id, quantity, order_quantity } = req.body

  const result = await pool.query(`
    INSERT INTO stock (product_id, store_id, quantity, order_quantity)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (product_id, store_id)
    DO UPDATE SET 
      quantity = $3,
      order_quantity = $4
    RETURNING *
  `, [product_id, store_id, quantity, order_quantity])
  res.json(result.rows[0])
})

// Update stock quantities
stockRouter.put('/stock/:id', async (req, res) => {
  const { id } = req.params
  const { quantity, order_quantity } = req.body

  const result = await pool.query(`
    UPDATE stock 
    SET quantity = $1, order_quantity = $2
    WHERE id = $3
    RETURNING *
  `, [quantity, order_quantity, id])
  
  res.json(result.rows[0])
})

// Delete stock entry
stockRouter.delete('/stock/:id', async (req, res) => {
  const { id } = req.params
  await pool.query('DELETE FROM stock WHERE id = $1', [id])
  res.json({ message: 'Stock entry deleted' })
})

stockRouter.get('/stock/:storeId/:productId', async (req, res) => {
  const { storeId, productId } = req.params
  const result = await pool.query(`
    SELECT quantity, order_quantity 
    FROM stock 
    WHERE store_id = $1 AND product_id = $2
  `, [storeId, productId])
  
  res.json(result.rows[0] || null)
})





export default stockRouter;
