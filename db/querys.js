import * as db from './index.js';

function createTables() {
  db.query(`
      CREATE TABLE IF NOT EXISTS products (
    plu SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(plu),
    store_id INTEGER NOT NULL REFERENCES stores(id),
    quantity INTEGER NOT NULL,
    order_quantity INTEGER NOT NULL DEFAULT 0
  );
  `);
}

// Product api
async function createProduct(name) {
  console.log('Creating product')
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
    return { data: result.rows[0] };
  } catch (error) {
    return { error: error.message };
  }
}

// Stock api
async function getStock(filters = {}) {
  try {
    let query = `SELECT s.id, p.plu, p.name, s.store_id, s.quantity, s.order_quantity FROM stock s JOIN products p ON s.product_id = p.plu WHERE 1=1`;
    const values = [];
    let paramCount = 1;
    if (filters.plu) {
      query += ` AND p.plu = $${paramCount}`;
      values.push(filters.plu);
      paramCount++;
    }
    if (filters.storeId) {
      query += ` AND s.store_id = $${paramCount}`;
      values.push(filters.storeId);
      paramCount++;
    }
    if (filters.name) {
      query += ` AND p.name ILIKE $${paramCount}`;
      values.push(`%${filters.name}%`);
      paramCount++;
    }
    const result = await db.query(query, values);
    return { data: result.rows };
  }
    catch (error) {
    return { error: error.message };
  }
}


    export {
  createTables,
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
};