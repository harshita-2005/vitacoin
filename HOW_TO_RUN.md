# 🚀 How to Run Frontend and Backend

## ✅ Current Status
- ✅ MongoDB Atlas connected successfully
- ✅ Backend running on port **5001**
- ✅ Ready to start frontend

---

## 🎯 **Option 1: Run Both Together (Recommended)**

### **Step 1: Stop Current Backend**
In your current terminal where backend is running:
- Press `Ctrl + C` to stop the backend

### **Step 2: Go to Root Directory**
```bash
cd ..
# You should be in: E:\fouth_yr_projects\Vitacoin_User_interface_rewards_and_transactions
```

### **Step 3: Run Both Servers**
```bash
npm run dev
```

This will start:
- ✅ Backend on `http://localhost:5001`
- ✅ Frontend on `http://localhost:3000`

**You'll see output from both servers in the same terminal!**

---

## 🎯 **Option 2: Run Separately (Two Terminals)**

### **Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Wait for:** `✅ MongoDB connected successfully`

### **Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Wait for:** Browser to open automatically at `http://localhost:3000`

---

## 📋 **What You Should See**

### **Backend Output:**
```
🚀 Vitacoin server running on port 5001
📊 Environment: development
🔗 API: http://localhost:5001/api
🔌 WebSocket: ws://localhost:5001
✅ MongoDB connected successfully
✅ Database: vitacoin
```

### **Frontend Output:**
```
Compiled successfully!

You can now view vitacoin-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🌐 **Access Your Application**

1. **Frontend**: Open browser to `http://localhost:3000`
2. **Backend API**: `http://localhost:5001/api`
3. **Health Check**: `http://localhost:5001/api/health`

---

## ⚠️ **Important Notes**

### **Port Configuration:**
- Backend: **5001** (check your `.env` file)
- Frontend: **3000** (default React port)
- Frontend proxy is set to `http://localhost:5001` ✅

### **If Frontend Can't Connect to Backend:**
1. Check backend is running on port 5001
2. Verify `frontend/package.json` has: `"proxy": "http://localhost:5001"`
3. Make sure both are running

---

## 🛑 **To Stop Servers**

### **If Running Together (Option 1):**
- Press `Ctrl + C` once (stops both)

### **If Running Separately (Option 2):**
- Press `Ctrl + C` in each terminal

---

## ✅ **Quick Start Commands**

```bash
# From root directory - Run both
npm run dev

# Or separately:
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm start
```

---

## 🎉 **You're Ready!**

Once both are running:
1. Open `http://localhost:3000`
2. Register a new account or login
3. Start playing games and earning coins!

---

**Need help?** Check the console for any errors!

