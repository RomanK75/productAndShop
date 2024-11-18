import express from 'express';
const productRouter = express.Router();
import * as q from '../db/querys.js';

// Product routes
productRouter.get('/product', async (req, res) => {
  const { plu, name } = req.query;
  // If both filters are empty, return all products
  if (!plu && !name) {
    const result = await q.getProduct({});
    return res.json(result);
  }

  // Create filter object with provided parameters
  const filters = {};
  if (plu) filters.plu = parseInt(plu);
  if (name) filters.name = name;

  const result = await q.getProduct(filters);
  res.json(result);
});
productRouter.post('/product', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await q.createProduct(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
productRouter.delete('/product/:plu', async (req, res) => {
  // delete product
  const plu = parseInt(req.params.plu);
  const result = await q.deleteProduct(plu);
  res.json(result);
});
productRouter.put('/product/:plu', async (req, res) => {
  const plu = parseInt(req.params.plu);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const result = await q.updateProduct(plu, name);
  res.json(result);
});

export default productRouter;
