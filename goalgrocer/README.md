# GoalGrocer (INF4027W Mini Project 2026)

GoalGrocer is a niche e-commerce platform for clean groceries focused on weight goals (Weight Loss / Maintenance).

## Implemented Scope

- Guest role:
  - Home page with featured products and promotions
  - Prompt-based recommendation (AI-powered when API key is configured, with local rule fallback)
  - Image upload similarity matching (filename-based simulation)
  - Store search and filters (category, goal, price, tags)
  - Add to cart and persistent cart in browser
  - Sign in only when checking out
- Customer role:
  - Register/login
  - Profile with saved goal and budget preferences
  - Wishlist management
  - Order history
  - Weekly meal plans with one-click add ingredients to cart
- Admin role:
  - Product CRUD (includes price, cost, calories, protein, category, tags, goal badges)
  - Category CRUD
  - Order viewing and filtering (payment type/status)
  - Reports:
    - Financial: revenue, cost of sales, profit, revenue by payment type
    - Product: best-selling, most-viewed, sales by category, promotion performance
    - Customer: top spending, average order value, purchase frequency, goal distribution

## Tech Stack

- React + Vite
- React Router
- Persistent browser storage used as NoSQL-style collections (`users`, `products`, `categories`, `orders`, `wishlists`, `dishes`) for this MVP.

## Run Locally

```bash
npm install
npm run dev
```

## Optional AI Setup (for rubric marks)

Add these variables to `.env.local`:

```bash
VITE_AI_API_KEY=your_key_here
VITE_AI_MODEL=gpt-4o-mini
VITE_AI_API_BASE_URL=https://api.openai.com/v1
```

Notes:
- If `VITE_AI_API_KEY` is missing, the app automatically falls back to local recommendations.
- The Home page displays which engine was used (`AI model` or `Local rules`) for transparent demo evidence.

## Lint

```bash
npm run lint
```

## Demo Accounts

- Admin
  - Email: `admin@goalgrocer.com`
  - Password: `Admin@123`

Customer accounts are created via the registration page.

## Notes

- Checkout is simulated (Card, Cash, PayPal); no real payment gateway.
- Inventory and delivery tracking are intentionally out of scope per brief assumptions.
