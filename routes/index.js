import express from 'express';
const router = express.Router();
import * as q from '../db/querys.js';


router.get('/', (req, res) => {
  res.send('Hello World!');

});

// Product routes

router.get('/product', async (req, res) => {
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
router.post('/product', async (req, res) => {
  try {
    const { name } = req.body
    console.log(name)
    if (!name) {
      console.log('Name is required')
      return res.status(400).json({ error: 'Name is required' })
    }
    const result = await q.createProduct(name)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
router.delete('/product/:plu', async (req, res) => {
  // delete product
  const plu = parseInt(req.params.plu);
  const result = await q.deleteProduct(plu);
  res.json(result);
});
router.put('/product/:plu', async (req, res) => {
  const plu = parseInt(req.params.plu);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const result = await q.updateProduct(plu, name);
  res.json(result);
});

// Stocks routes
router.get('/stock/:storeId', async (req, res) => {
  const store_id = req.params.storeId;
  const { plu, name } = req.query;
  // If both filters are empty, return all products
  if (!plu && !name) {
    const result = await q.getStock({store_id});
    return res.json(result);
  }
  // Create filter object with provided parameters
  const filters = {};
  if (plu) filters.plu = parseInt(plu);
  if (name) filters.name = name;
  if (store_id) filters.store_id = parseInt(store_id);
  const result = await q.getStock(filters);
  res.json(result);
});



export default router;
