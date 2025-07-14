# OweGo

OweGo is a free web app for splitting money among groups and friends, with a self-expense tracker and many features. Easily manage group expenses, track who owes whom, and settle up with a clear, modern interface.

## Features
- Create and manage groups for trips, events, or friends
- Add expenses and split them among group members
- Track your personal and group balances
- See who owes you and whom you owe
- Settle up balances with a single click
- User authentication and profile management
- Dashboard with recent activity and statistics
- Responsive, modern UI (React + Tailwind)

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens)

## Folder Structure
```
├── backend/         # Express API, MongoDB models, routes
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── ...
├── frontend/        # React app (Vite), components, assets
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── ...
│   ├── index.html
│   └── ...
└── README.md
```

## Getting Started (Run Locally)

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/OweGo.git
cd OweGo
```

### 2. Setup Backend
```bash
cd backend
npm install
# Create a .env file with your MongoDB URI and JWT secret
cp .env.example .env
# Edit .env as needed
npm start
```
- The backend runs on `http://localhost:3001` by default.

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
- The frontend runs on `http://localhost:5173` by default (Vite).
- It proxies API requests to the backend.

### 4. Environment Variables
- **Backend:**
  - `.env` should contain:
    - `MONGODB_URI=your_mongodb_connection_string`
    - `JWT_SECRET=your_jwt_secret`
- **Frontend:**
  - Usually no .env needed unless customizing API URL.

## Workflow & Development
- **Frontend:**
  - All React code is in `frontend/src/components/`.
  - Use `npm run dev` for hot-reload development.
  - Main entry: `App.jsx` (routes defined here).
- **Backend:**
  - All API endpoints in `backend/routes/`.
  - Models in `backend/models/`.
  - Use `npm start` (with nodemon) for auto-reload.
- **Authentication:**
  - JWT stored in localStorage, sent with each API request.
- **Typical Flow:**
  1. User signs up/logs in
  2. Creates or joins a group
  3. Adds expenses to group
  4. Views dashboard/profile for balances
  5. Settles up when ready

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

