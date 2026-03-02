# GoalGrocer (INF4027W Mini Project 2026)

GoalGrocer is a nutrition-focused e-commerce app with customer and admin workflows, recommendations, meal plans, and reporting.

## How To Run The Application

## 1) Prerequisites
- Node.js 18+ (or newer LTS)
- npm 9+
- A Firebase project (Firestore + Authentication + Storage)

## 2) Install dependencies
```bash
npm install
```

## 3) Configure environment variables
Create `.env.local` in the project root (or copy from `.env.example`) and set:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional AI image/prompt recommendations
VITE_AI_API_KEY=your_openai_api_key
VITE_AI_MODEL=gpt-4o-mini
VITE_AI_API_BASE_URL=https://api.openai.com/v1
```

Notes:
- If `VITE_AI_API_KEY` is not set, recommendation flow falls back to local image/rule matching.
- Never commit `.env.local`.

## 4) Start development server
```bash
npm run dev
```

Then open the local URL shown in terminal (usually `http://localhost:5173`).

## 5) Build for production
```bash
npm run build
npm run preview
```

## 6) Lint
```bash
npm run lint
```

## Demo Accounts
- Admin
  - Email: `admin@goalgrocer.com`
  - Password: `Admin@123`
- Customer
  - Register via the `Create account` page
