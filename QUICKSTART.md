# Campus Cruise - Quick Start Guide

This guide will help you get the Campus Cruise application up and running quickly.

## Prerequisites Check

Before starting, ensure you have:
- ✓ Node.js 18+ installed (`node --version`)
- ✓ MySQL 8.0+ installed and running
- ✓ npm installed (`npm --version`)

## Quick Setup (5 minutes)

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Backend Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update these required fields:
# - DB_PASSWORD (your MySQL password)
# - JWT_SECRET (generate a random string)
# - EMAIL_USER and EMAIL_PASSWORD (for email features)
# - Firebase credentials (for real-time features)
```

### Step 3: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE campus_cruise;
exit;
```

### Step 4: Test Backend Connection

```bash
# Still in backend directory
npm run test:connection
```

You should see:
```
✓ MySQL database connection successful
✓ Firebase initialization successful (or skip if not configured yet)
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Backend should now be running at `http://localhost:5000`

Test it by visiting: `http://localhost:5000/health`

### Step 6: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 7: Configure Frontend Environment

```bash
# Copy the example environment file
cp .env.example .env

# The defaults should work if backend is on port 5000
```

### Step 8: Start Frontend Server

```bash
npm run dev
```

Frontend should now be running at `http://localhost:3000`

## Verify Installation

1. Open `http://localhost:3000` in your browser
2. You should see the Campus Cruise welcome page
3. Backend API is accessible at `http://localhost:5000/health`

## Next Steps

The project structure is now set up! You can proceed with implementing features according to the task list in `.kiro/specs/campus-cruise/tasks.md`.

The next task is typically:
- Task 2: Implement database models and migrations

## Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check `.env` file has correct credentials

### Frontend won't start
- Ensure backend is running first
- Check port 3000 is not in use
- Verify `.env` file has correct API URL

### Connection test fails
- MySQL: Check credentials in `.env`
- Firebase: Verify Firebase credentials (can skip for now)

## Optional: Firebase Setup

Firebase is used for real-time location tracking. You can skip this initially and add it later:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Download service account credentials
4. Add credentials to backend `.env` file

## Development Workflow

1. Backend runs on port 5000
2. Frontend runs on port 3000
3. Frontend proxies API requests to backend
4. Changes auto-reload with nodemon (backend) and Vite (frontend)

Happy coding! 🚗
