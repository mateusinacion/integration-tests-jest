# Game of Thrones API

API REST simples para servir de alvo dos testes de integração. Roda em Cloudflare Workers (Hono + D1, smart placement).

## Endpoints

| Método | Rota                   | Descrição                                   | Respostas             |
| ------ | ---------------------- | ------------------------------------------- | --------------------- |
| GET    | `/api/health`          | Health check                                | 200                   |
| GET    | `/api/houses`          | Lista de casas aceitas em `house`           | 200                   |
| GET    | `/api/characters`      | Lista personagens (`?house=`, `?alive=`)    | 200, 400              |
| GET    | `/api/characters/:id`  | Busca por id                                | 200, 400, 404         |
| POST   | `/api/characters`      | Cria personagem                             | 201, 400, 409         |
| PUT    | `/api/characters/:id`  | Substitui personagem                        | 200, 400, 404, 409    |
| DELETE | `/api/characters/:id`  | Remove personagem                           | 204, 400, 404         |

Body de `POST`/`PUT`:

```json
{ "name": "Bran Stark", "house": "Stark", "title": "Three-Eyed Raven", "alive": true }
```

- `name`: obrigatório, 2–60 chars, único (409 se repetido)
- `house`: obrigatório, um dos valores de `GET /api/houses`
- `title`: opcional, 1–80 chars ou `null`
- `alive`: opcional, default `true`

Erros seguem o formato `{ "error": "validation_error" | "not_found" | "conflict", "message"?, "issues"? }`.

## Rodar local

```sh
npm install
npm run db:migrate:local
npm run dev
```

## Deploy

Feito pelo workflow `.github/workflows/deploy-api.yml` a cada push em `main` que altere `api/**`. Precisa dos secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no repositório. O workflow cria o banco D1 `got-db` se não existir, aplica as migrations e publica o Worker.
