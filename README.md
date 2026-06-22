# codevector-task

Backend API for browsing 200,000 products with cursor-based pagination, plus a Vite React frontend for browsing and filtering the catalog.

The API is powered by Node.js, Express, PostgreSQL, and Neon. The frontend is a React + Vite app that consumes the backend and renders the paginated product table.

## 1. Project Overview

This repository contains a backend API for browsing a large product catalog with stable cursor-based pagination.
It also includes a React frontend that lets you filter by category and move through the data with Next / Previous controls.

## 2. Live Links

- Frontend URL: https://codevector-task-murex.vercel.app
- Backend API URL: https://codevector-task-1.onrender.com/api/products

## 3. Tech Stack

- Node.js
- Express
- PostgreSQL
- Neon
- Render
- Vercel
- React
- Vite

## 4. How It Works

The API uses cursor-based pagination instead of offset pagination.

With offset pagination, page 20 means the database still has to count and skip everything before it. As the table grows, that gets slower and slower, and records can be duplicated or skipped if new rows are inserted while the user is paging.

Cursor pagination avoids that problem by remembering the last row from the previous page. In this project, the cursor contains `created_at` and `id`, encoded as a base64 JSON string. The API uses that pair to request the next rows with a tuple comparison like `(created_at, id) < (...)`, which keeps the ordering stable.

The composite index on `(category, created_at DESC, id DESC)` matters because it matches the filter and sort pattern used by the endpoint. That lets PostgreSQL find the next page efficiently instead of scanning the table.

## 5. API Reference

### GET /api/products

Query parameters:

- `category` - optional string filter
- `cursor` - optional string, base64 encoded JSON containing `{ created_at, id }`
- `limit` - optional number, defaults to `20`, maximum `100`

Example request:

```bash
GET /api/products?category=Electronics&limit=20
```

Example response:

```json
{
  "products": [
	 {
		"id": "9f3a3a3b-2fd7-4d2f-8a90-5a5d4f7cf2ab",
		"name": "Product Smart Orbit 4821",
		"category": "Electronics",
		"price": "249.99",
		"created_at": "2026-03-14T11:22:31.000Z",
		"updated_at": "2026-03-14T11:24:10.000Z"
	 }
  ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy0xNFQxMToyMjozMS4wMDBaIiwiaWQiOiI5ZjNhM2EzYi0yZmQ3LTRkMmYtOGE5MC01YTVkNGY3Y2YyYWIifQ=="
}
```

When there is no next page, `nextCursor` is `null`.

## 6. Project Structure

```text
codevector-task/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── index.js
├── package.json
├── scripts/
│   ├── seed.js
│   └── setup-db.js
├── src/
│   ├── app.js
│   ├── db.js
│   └── routes/
│       └── products.js
└── .env.example
```

## 7. Local Setup

1. Clone the repository.

	```bash
	git clone https://github.com/Rohit-Rathod95/codevector-task.git
	cd codevector-task
	```

2. Install backend dependencies from the repo root.

	```bash
	npm install
	```

3. Install frontend dependencies.

	```bash
	cd client
	npm install
	cd ..
	```

4. Create your backend environment file.

	```bash
	cp .env.example .env
	```

	Add your PostgreSQL connection string and port to `.env`.

5. Create the database table and index.

	```bash
	npm run setup-db
	```

6. Seed the database with sample products.

	```bash
	npm run seed
	```

7. Start the backend server.

	```bash
	npm start
	```

8. Start the frontend app in a second terminal.

	```bash
	cd client
	npm run dev
	```

## 8. Seed Script

The seed script inserts 200,000 products into the `products` table.
It uses bulk inserts in batches of 1,000 rows at a time, which is much faster than inserting one row at a time.

Each generated product includes a random name, category, price, and timestamps so the pagination and sorting logic can be tested with realistic data.

## 9. What I'd Improve with More Time

- Add a price filter
- Add search by name
- Add rate limiting
- Add cursor expiry and validation metadata