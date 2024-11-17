import pg from 'pg';
import 'dotenv/config';
import fs from 'fs';


const logfile = './db/logs/loginfo.log';

const { Pool} = pg;

//  db connection
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// query function + logs
export async function query(text, params) {
  const start = Date.now();
  const formatedStart = new Date(start).toLocaleString('ru-Ru', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  const logData = `${formatedStart}\nexecuted query: ${text}, duration: ${duration}ms\n`;
  fs.appendFileSync(logfile, logData);
  return res;
};