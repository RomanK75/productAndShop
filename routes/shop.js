import express from 'express';
const shopRouter = express.Router();
import * as q from '../db/querys.js';

shopRouter.post('/shop', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await q.createStore(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
shopRouter.get('/shop', async (req, res) => {
  const { id, name } = req.query;
  // If both filters are empty, return all products
  if (!id && !name) {
    const result = await q.getShop({});
    return res.json(result);
  }

  // Create filter object with provided parameters
  const filters = {};
  if (id) filters.id = parseInt(id);
  if (name) filters.name = name;

  const result = await q.getShop(filters);
  res.json(result);
});
shopRouter.delete('/shop/:id', async (req, res) => {
  const { id } = req.params;
  const result = await q.deleteShop(id);
  res.json(result);
});

export default shopRouter;
