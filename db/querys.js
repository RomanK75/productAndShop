import * as db from './index.js';
import 'dotenv/config';

//  Create tables
function createTables() {
  db.query(`
  CREATE TABLE IF NOT EXISTS products (
    plu SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(plu) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    order_quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE (product_id, store_id)
  );
  `);
}

// History service notification
async function notifyHistoryService(action) {
  try {
    await fetch(String(process.env.HISTORY_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });
  } catch (error) {
    console.error('Error notifying history service:', error);
  }
}

// Product querys
async function createProduct(name) {
  try {
    if (typeof name !== 'string') {
      return {
        error: 'Name must be a string',
      };
    }
    if (name.trim() === '') {
      return {
        error: 'Name cannot be empty',
      };
    }
    const query = `
    INSERT INTO products (name)
    VALUES ($1)
    ON CONFLICT (name) DO NOTHING
    RETURNING plu, name;
    `;
    const values = [name];
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return {
        error: 'Product already exists',
      };
    }
    await notifyHistoryService({
      action: `create product ${name} ${result.rows[0].plu}`,
      plu: result.rows[0].plu,
    });
    return result.rows[0];
  } catch (error) {
    console.log(error);
  }
}
async function deleteProduct(plu) {
  try {
    const query = `
    DELETE FROM products 
    WHERE plu = $1
    RETURNING plu, name;
    `;
    const values = [plu];
    const result = await db.query(query, values);
    await notifyHistoryService({
      action: `delete product ${result.rows[0].name} ${result.rows[0].plu}`,
      plu: result.rows[0].plu,
    });
    return { data: result.rows[0] };
  } catch (error) {
    return { error: error.message };
  }
}
async function getProduct(filters = {}) {
  try {
    let query = `SELECT plu, name FROM products WHERE 1=1`;
    const values = [];
    let paramCount = 1;

    if (filters.plu) {
      query += ` AND plu = $${paramCount}`;
      values.push(filters.plu);
      paramCount++;
    }

    if (filters.name) {
      query += ` AND name ILIKE $${paramCount}`;
      values.push(`%${filters.name}%`);
      paramCount++;
    }

    const result = await db.query(query, values);
    return { data: result.rows };
  } catch (error) {
    return { error: error.message };
  }
}
async function updateProduct(plu, newName) {
  try {
    if (typeof newName !== 'string' || newName.trim() === '') {
      return { error: 'Valid name is required' };
    }

    const query = `
    UPDATE products 
    SET name = $1
    WHERE plu = $2
    RETURNING plu, name;
    `;
    const values = [newName, plu];
    const result = await db.query(query, values);
    await notifyHistoryService({
      action: `update product ${result.rows[0].name} ${result.rows[0].plu}`,
      plu: result.rows[0].plu,
    });
    return { data: result.rows[0] };
  } catch (error) {
    return { error: error.message };
  }
}

// Stock querys
async function getStockWithFilters(filters = {}) {
  try {
    let query = `
      SELECT 
        s.id,
        s.quantity,
        s.order_quantity,
        p.plu,
        p.name as product_name,
        st.id as store_id,
        st.name as store_name
      FROM stock s
      JOIN products p ON s.product_id = p.plu
      JOIN stores st ON s.store_id = st.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.plu) {
      query += ` AND p.plu = $${paramCount}`;
      values.push(filters.plu);
      paramCount++;
    }

    if (filters.store_id) {
      query += ` AND st.id = $${paramCount}`;
      values.push(filters.store_id);
      paramCount++;
    }

    if (filters.quantity_from !== undefined) {
      query += ` AND s.quantity >= $${paramCount}`;
      values.push(filters.quantity_from);
      paramCount++;
    }

    if (filters.quantity_to !== undefined) {
      query += ` AND s.quantity <= $${paramCount}`;
      values.push(filters.quantity_to);
      paramCount++;
    }

    if (filters.order_quantity_from !== undefined) {
      query += ` AND s.order_quantity >= $${paramCount}`;
      values.push(filters.order_quantity_from);
      paramCount++;
    }

    if (filters.order_quantity_to !== undefined) {
      query += ` AND s.order_quantity <= $${paramCount}`;
      values.push(filters.order_quantity_to);
      paramCount++;
    }

    const result = await db.query(query, values);
    return { data: result.rows };
  } catch (error) {
    return { error: error.message };
  }
}

// Store querys
async function createStore(name) {
  try {
    if (typeof name !== 'string') {
      return { error: 'Name must be a string' };
    }
    if (name.trim() === '') {
      return { error: 'Name cannot be empty' };
    }
    const query = `
    INSERT INTO stores (
    name
    )
    VALUES ($1)
    ON CONFLICT (name) DO NOTHING
    RETURNING id, name;
    `;
    const values = [name];
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return { error: 'Store already exists' };
    }
    await notifyHistoryService({
      action: `create store ${result.rows[0].name} ${result.rows[0].id}`,
      shop_id: result.rows[0].id,
    });
    return result.rows[0];
  } catch (error) {
    return { error: error.message };
  }
}
async function getShop(filters = {}) {
  try {
    let query = `SELECT id, name FROM stores WHERE 1=1`;
    const values = [];
    let paramCount = 1;

    if (filters.id) {
      query += ` AND id = $${paramCount}`;
      values.push(filters.id);
      paramCount++;
    }

    if (filters.name) {
      query += ` AND name ILIKE $${paramCount}`;
      values.push(`%${filters.name}%`);
      paramCount++;
    }

    const result = await db.query(query, values);
    return { data: result.rows };
  } catch (error) {
    return { error: error.message };
  }
}
async function deleteShop(id) {
  try {
    const query = `
    DELETE FROM stores
    WHERE id = $1
    RETURNING id, name;
    `;
    const values = [id];
    const result = await db.query(query, values);
    await notifyHistoryService({
      action: `delete store ${result.rows[0].name} ${result.rows[0].id}`,
      shop_id: result.rows[0].id,
    });
    return { data: result.rows[0] };
  } catch (error) {
    return { error: error.message };
  }
}

export {
  createTables,
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  getStockWithFilters,
  createStore,
  getShop,
  deleteShop,
  notifyHistoryService,
};
