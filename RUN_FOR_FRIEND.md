# Steps to Run Vitacoin (For New Setup)

Follow these steps to clone and run the project from GitHub.

**Repo:** [https://github.com/harshita-2005/vitacoin](https://github.com/harshita-2005/vitacoin)

---

## 1. Prerequisites

Install these first (if not already installed):

- **Node.js** (v16 or higher) — [https://nodejs.org](https://nodejs.org)
- **MongoDB** — either:
  - **MongoDB Atlas** (cloud, free tier): [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) — **recommended**, no local install
  - Or **MongoDB** installed locally
- **Git** — [https://git-scm.com](https://git-scm.com)

---

## 2. Clone the Repository

Open a terminal (Command Prompt, PowerShell, or Git Bash) and run:

```bash
git clone https://github.com/harshita-2005/vitacoin.git
cd vitacoin
```

If the project uses branch **mypj**, switch to it:

```bash
git checkout mypj
```

---

## 3. Install Dependencies

From the **vitacoin** folder (project root), run:

```bash
npm install
cd backend
npm install
cd ../frontend
npm install
cd ..
```

Or use the project script (if available):

```bash
npm run install-all
```

---

## 4. Environment Setup

### Backend `.env`

1. Go to the **backend** folder.
2. Create a file named **`.env`** (no filename before the dot).
3. Add the following (replace the values as needed):

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB – use your own Atlas URI or local MongoDB
MONGODB_URI=mongodb://localhost:27017/vitacoin
# If using Atlas: MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/vitacoin?retryWrites=true&w=majority

# JWT (use a long random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d

# Optional
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

- **Local MongoDB:** `MONGODB_URI=mongodb://localhost:27017/vitacoin`
- **MongoDB Atlas:** Get the connection string from your Atlas cluster (Database → Connect → Connect your application) and paste it in `MONGODB_URI`.

### Frontend `.env` (optional)

If the frontend needs the API URL, create **frontend/.env**:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
```

(Use **5001** if your backend runs on 5001; use **5000** if it runs on 5000.)

---

## 5. Start MongoDB (only if using local MongoDB)

- **MongoDB Atlas:** Skip this; Atlas runs in the cloud.
- **Local MongoDB:** Start the MongoDB service (e.g. from Services on Windows, or `brew services start mongodb-community` on Mac).

---

## 6. Run the Application

From the **project root** (the `vitacoin` folder):

```bash
npm run dev
```

This starts:

- **Backend** — usually `http://localhost:5001`
- **Frontend** — usually `http://localhost:3000`

Wait until you see messages like “MongoDB connected” and “Compiled successfully” (or the browser opens).

---

## 7. Open the App

In the browser go to:

**http://localhost:3000**

- Register a new account, or use the **demo** account if available (e.g. email: `demo@vitacoin.com`, password: `demo123` — check the Login page for exact credentials).

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| **Port already in use** | Change `PORT` in **backend/.env** (e.g. to 5002) and use the same port in frontend `.env` if you set it. |
| **MongoDB connection error** | Check `MONGODB_URI` in **backend/.env**. For Atlas: correct username, password, and cluster URL. |
| **Frontend can’t reach API** | Ensure **backend** is running and `REACT_APP_API_URL` in **frontend/.env** matches the backend port. |
| **Dependencies error** | From project root run: `cd backend && npm install`, then `cd ../frontend && npm install`. |
| **Wrong branch** | Run `git branch -a` and then `git checkout mypj` (or the branch you need). |

---

## Quick Command Summary

```bash
git clone https://github.com/harshita-2005/vitacoin.git
cd vitacoin
git checkout mypj
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..
# Create backend/.env (and optionally frontend/.env) as above
npm run dev
# Open http://localhost:3000
```

---

**Repo link:** [https://github.com/harshita-2005/vitacoin](https://github.com/harshita-2005/vitacoin)
