import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

const dbPath = path.join(process.cwd(), 'src', 'data', 'products.db');

export type ProductRow = {
  id: number;
  source: string;
  kWp: number;
  phase: number;
  module: number;
  qty: number;
  price: number;
  wire: number;
  outOfVns: number;
};

let dbInstance: any = null;
let SQL: any = null;

async function ensureDb() {
  if (dbInstance) return dbInstance;
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const file = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(new Uint8Array(file));
  } else {
    dbInstance = new SQL.Database();
  }
  return dbInstance;
}

export async function getAllProducts(): Promise<ProductRow[]> {
  const db = await ensureDb();
  const res = db.exec('SELECT * FROM products');
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row: any[]) => {
    const obj: any = {};
    row.forEach((val, idx) => (obj[cols[idx]] = val));
    return obj as ProductRow;
  });
}

export async function getProductsBySource(source: string): Promise<ProductRow[]> {
  const db = await ensureDb();

  // simplest: run exec with WHERE
  const res = db.exec(`SELECT * FROM products WHERE source = '${source.replace("'", "\\'")}'`);
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row: any[]) => {
    const obj: any = {};
    row.forEach((val, idx) => (obj[cols[idx]] = val));
    return obj as ProductRow;
  });
}

export async function findProduct(kWp: number, phase: number) {
  const db = await ensureDb();
  const res = db.exec(`SELECT * FROM products WHERE kWp = ${kWp} AND phase = ${phase} LIMIT 1`);
  if (!res || res.length === 0) return null;
  const cols = res[0].columns;
  const row = res[0].values[0];
  const obj: any = {};
  row.forEach((val: any, idx: number) => (obj[cols[idx]] = val));
  return obj as ProductRow;
}
