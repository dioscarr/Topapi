# Quick Start Guide

This guide will help you get the Topapi API up and running in minutes.

## Prerequisites

- Node.js 16+ installed
- npm 8+ installed
- A Supabase account (free tier works!)

## Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project (or use an existing one)
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 2: Set Up the Database

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `database-setup.sql` from this repository
4. Paste it into the SQL Editor and click **Run**
5. You should see success messages confirming tables were created

## Step 3: Configure the Application

1. Clone this repository:
   ```bash
   git clone https://github.com/dioscarr/Topapi.git
   cd Topapi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.local.example .env
   ```

4. Edit `.env` and add your Supabase credentials:
   ```env
   NODE_ENV=development
   PORT=3000
   API_BASE_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   APP_URL=http://localhost:3000
   ```

## Step 4: Start the Server

Run in development mode with auto-reload:

```bash
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 3000
📚 API Documentation available at http://localhost:3000/api-docs
🔗 API Base URL: http://localhost:3000/api
```

## Step 5: Test the API

### Option 1: Use the Browser

1. Open http://localhost:3000 in your browser
2. Click **"API Documentation"** to explore all endpoints
3. Click **"Health Check"** to verify the API is working

### Option 2: Use curl

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

You should get:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 10.123,
  "environment": "development"
}
```

## Step 6: Try User Authentication

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure123456"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure123456"
  }'
```

Save the `access_token` from the response!

### 3. Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create a Profile

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_FROM_LOGIN",
    "username": "johndoe",
    "full_name": "John Doe",
    "bio": "Hello, I am testing this API!"
  }'
```

## Common Issues

### "Missing Supabase environment variables"

**Problem:** The API can't find your Supabase credentials.

**Solution:** 
- Make sure you created the `.env` file
- Verify the file contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check that the values are correct (no quotes needed)

### "Port 3000 already in use"

**Problem:** Another application is using port 3000.

**Solution:** Change the port in your `.env` file:
```env
PORT=3001
```

### "Database connection failed"

**Problem:** Can't connect to Supabase database.

**Solution:**
- Verify your Supabase URL and key are correct
- Check that your Supabase project is active
- Make sure you ran the `database-setup.sql` script

### "CORS error" in browser

**Problem:** Frontend can't make requests to the API.

**Solution:** Update `CORS_ORIGIN` in your `.env` file to match your frontend URL:
```env
CORS_ORIGIN=http://localhost:3001
```

## Next Steps

✅ **Explore the API Documentation**: Visit http://localhost:3000/api-docs to see all available endpoints and try them out interactively.

✅ **Read the Full README**: Check out `README.md` for detailed information about all features.

✅ **Deploy to Production**: Follow the deployment guide in `DEPLOYMENT.md` for Cloudways hosting.

✅ **Customize**: Modify routes in `api/routes/` to add your own endpoints.

## Getting Help

- 📖 Check the [README.md](README.md) for detailed documentation
- 🚀 Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 🔧 Look at the example files in the repository
- 🐛 Open an issue on GitHub if you find a bug

## What's Next?

Now that your API is running:

1. **Add Custom Endpoints**: Create new routes in `api/routes/`
2. **Modify Database Schema**: Update Supabase tables for your needs
3. **Add Business Logic**: Implement your application features
4. **Deploy to Production**: Follow the Cloudways deployment guide
5. **Connect Your Frontend**: Use the API with React, Vue, or any frontend framework

Happy coding! 🚀
