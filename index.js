import express from 'express';
import router from './routes/index.js';
import { createTables } from './db/querys.js';
import bodyParser from 'body-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import 'dotenv/config';

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

app.use('/api', router);
app.use('/api', apiProxy);

const port = 3000;

createTables();

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});