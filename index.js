import express from 'express';
import productRouter from './routes/product.js';

import shopRouter from './routes/shop.js';
import { createTables } from './db/querys.js';
import bodyParser from 'body-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import 'dotenv/config';
import stockRouter from './routes/stock.js';

// Create proxy for test and CORS issues
const apiProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '',
    },
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.use('/api', productRouter);
app.use('/api', stockRouter);
app.use('/api', shopRouter);
app.use('/api', apiProxy);

const port = 3000;

createTables();

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});