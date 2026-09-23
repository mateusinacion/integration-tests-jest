import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

type Bindings = { DB: D1Database };

const HOUSES = ['Stark', 'Lannister', 'Targaryen', 'Baratheon', 'Greyjoy', 'Tyrell', 'Martell', 'Tully', 'Arryn', 'Tarth', 'Tarly', "Night's Watch"] as const;

const characterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  house: z.enum(HOUSES),
  title: z.string().trim().min(1).max(80).nullable().optional(),
  alive: z.boolean().optional().default(true),
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  house: z.enum(HOUSES).optional(),
  alive: z.enum(['true', 'false']).optional(),
});

type Row = { id: number; name: string; house: string; title: string | null; alive: number; created_at: string; updated_at: string };
const toJson = (r: Row) => ({ ...r, alive: r.alive === 1 });

const validationHook = (result: any, c: Context) => {
  if (!result.success) {
    const issues = (result.error as z.ZodError).issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return c.json({ error: 'validation_error', issues }, 400);
  }
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => c.json({ name: 'Game of Thrones API', endpoints: ['GET /api/health', 'GET /api/houses', 'GET /api/characters', 'GET /api/characters/:id', 'POST /api/characters', 'PUT /api/characters/:id', 'DELETE /api/characters/:id'] }));

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/houses', (c) => c.json({ data: HOUSES }));

app.get('/api/characters', zValidator('query', listQuery, validationHook), async (c) => {
  const { house, alive } = c.req.valid('query');
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (house) { where.push('house = ?'); params.push(house); }
  if (alive) { where.push('alive = ?'); params.push(alive === 'true' ? 1 : 0); }
  const sql = `SELECT * FROM characters${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY id`;
  const { results } = await c.env.DB.prepare(sql).bind(...params).all<Row>();
  return c.json({ data: results.map(toJson), total: results.length });
});

app.get('/api/characters/:id', zValidator('param', idParam, validationHook), async (c) => {
  const { id } = c.req.valid('param');
  const row = await c.env.DB.prepare('SELECT * FROM characters WHERE id = ?').bind(id).first<Row>();
  if (!row) return c.json({ error: 'not_found', message: `Character ${id} not found` }, 404);
  return c.json({ data: toJson(row) });
});

app.post('/api/characters', zValidator('json', characterSchema, validationHook), async (c) => {
  const body = c.req.valid('json');
  const exists = await c.env.DB.prepare('SELECT id FROM characters WHERE name = ?').bind(body.name).first();
  if (exists) return c.json({ error: 'conflict', message: `Character '${body.name}' already exists` }, 409);
  const row = await c.env.DB.prepare('INSERT INTO characters (name, house, title, alive) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(body.name, body.house, body.title ?? null, body.alive ? 1 : 0)
    .first<Row>();
  return c.json({ data: toJson(row!) }, 201);
});

app.put('/api/characters/:id', zValidator('param', idParam, validationHook), zValidator('json', characterSchema, validationHook), async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const current = await c.env.DB.prepare('SELECT id FROM characters WHERE id = ?').bind(id).first();
  if (!current) return c.json({ error: 'not_found', message: `Character ${id} not found` }, 404);
  const clash = await c.env.DB.prepare('SELECT id FROM characters WHERE name = ? AND id != ?').bind(body.name, id).first();
  if (clash) return c.json({ error: 'conflict', message: `Character '${body.name}' already exists` }, 409);
  const row = await c.env.DB.prepare(
    "UPDATE characters SET name = ?, house = ?, title = ?, alive = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? RETURNING *",
  )
    .bind(body.name, body.house, body.title ?? null, body.alive ? 1 : 0, id)
    .first<Row>();
  return c.json({ data: toJson(row!) });
});

app.delete('/api/characters/:id', zValidator('param', idParam, validationHook), async (c) => {
  const { id } = c.req.valid('param');
  const { meta } = await c.env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(id).run();
  if (meta.changes === 0) return c.json({ error: 'not_found', message: `Character ${id} not found` }, 404);
  return c.body(null, 204);
});

app.notFound((c) => c.json({ error: 'not_found', message: `Route ${c.req.method} ${c.req.path} not found` }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error', message: 'Unexpected error' }, 500);
});

export default app;
