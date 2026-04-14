# OweGo

OweGo is a free web app for splitting money among groups and friends, with a self-expense tracker and many features. Easily manage group expenses, track who owes whom, and settle up with a clear, modern interface.

## Features
- Create and manage groups for trips, events, or friends
- Add expenses and split them among group members
- Track your personal and group balances
- See who owes you and whom you owe
- Settle up balances with a single click
- Smart debt simplification and disbursement logic for group settlements
- Strict expense modification locks post-settlement
- User authentication with email/password and Google OAuth
- Dashboard with recent activity and statistics
- Responsive, modern UI (React + Tailwind)

## How OweGo Works (A Complete Layman's Guide)

OweGo is designed to mirror how people naturally share costs in real life, completely eliminating the confusion of "who owes exactly what" without needing complex math.

### 1. Getting Started
* **Sign Up / Login:** You can register a traditional account or simply hit "Sign in with Google" for secure, one-click access. Your email protects your digital identity.

### 2. Team Up in Groups
* **Create a Group:** Going on a trip? Sharing an apartment? Hit "+ Create Group" to spin up an environment. You are immediately assigned as the Group Admin.
* **Invite Friends:** Search for other OweGo users by username and easily add them to the ledger.

### 3. Adding Everyday Expenses
* Just bought pizza for everyone? Hit "Add Expense".
  * **Who paid?** Usually you, but you can record if a friend paid.
  * **Total Cost?** Enter the exact bill amount.
  * **Split Among:** Choose which group members were involved in eating the pizza.
* The system instantly calculates the math! If you split $50 among 5 people, OweGo silently notes that 4 people now owe you $10 each. 

### 4. Tracking Your Money
* **Group Ledger:** Inside any group, you'll see a chronological timeline of every purchase made, who paid, and who owes what.
* **Personal Dashboard:** The magical big-picture view! OweGo merges your data across *all* your different groups to show you a final "Net Balance" (e.g., "In total, you are owed $60").

### 5. Settling Up & Smart Simplification
* When the trip is finished, just click **Settle Up**.
* **Smart Payouts:** Let's say Alice owes Bob $10, and Bob owes Charlie $10. Instead of forcing everyone to make multiple messy transfers, OweGo calculates the simplest route forward and simply tells Alice to pay $10 directly to Charlie!
* **Read-Only Lock:** Once someone settles up their debt in a group, OweGo automatically locks past expenses. Nobody can retroactively edit or delete a settled bill, keeping your shared finances permanently honest and secure.

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
    - `GOOGLE_CLIENT_ID=your_google_client_id`
- **Frontend:**
  - `.env` should contain:
    - `VITE_BACKEND_URL=your_backend_api_url`
    - `VITE_GOOGLE_CLIENT_ID=your_google_client_id`

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

