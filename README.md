# Topapi - Production-Ready Node.js API

A secure, performant, and production-ready RESTful API built with Express.js and Supabase integration. This API provides user authentication, profile management, and comprehensive documentation through Swagger UI.

## 🚀 Features

- **Express.js Framework**: Fast, unopinionated web framework for Node.js
- **Supabase Integration**: Powerful backend-as-a-service with PostgreSQL database
- **JWT Authentication**: Secure token-based authentication
- **API Documentation**: Interactive Swagger UI for testing and documentation
- **Security Best Practices**:
  - Helmet.js for security headers
  - CORS configuration
  - Rate limiting
  - Input validation with express-validator
- **Request Logging**: Morgan logger for HTTP requests
- **Error Handling**: Centralized error handling middleware
- **SPA Support**: Static file serving with fallback routing
- **Environment Configuration**: Separate configs for development and production

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Supabase account and project

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dioscarr/Topapi.git
cd Topapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

#### For Local Development:

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
APP_URL=http://localhost:3000
```

#### For Production:

Copy the production example:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
NODE_ENV=production
PORT=3000
API_BASE_URL=https://phpstack-868870-5982515.cloudwaysapps.com
CORS_ORIGIN=https://phpstack-868870-5982515.cloudwaysapps.com
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
APP_URL=https://phpstack-868870-5982515.cloudwaysapps.com
```

### 4. Set Up Supabase Database

Create the following tables in your Supabase project:

#### Users Table (if not using default auth.users)

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

#### Profiles Table

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);
```

## 🚀 Running the Application

### Development Mode

Run with hot-reloading using nodemon:

```bash
npm run dev
```

The API will be available at: `http://localhost:3000`

### Production Mode

```bash
npm start
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`

## 🔌 API Endpoints

### Health Check

- `GET /api/health` - Check API health
- `GET /api/health/db` - Check database connection

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires authentication)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires authentication)
- `POST /api/auth/reset-password` - Request password reset

### Users

- `GET /api/users` - Get all users (requires authentication)
- `GET /api/users/:id` - Get user by ID (requires authentication)
- `PATCH /api/users/:id` - Update user (requires authentication)
- `DELETE /api/users/:id` - Delete user (requires authentication)

### Profiles

- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get profile by ID
- `POST /api/profiles` - Create profile (requires authentication)
- `PATCH /api/profiles/:id` - Update profile (requires authentication)
- `DELETE /api/profiles/:id` - Delete profile (requires authentication)

## 🔐 Authentication

This API uses JWT tokens provided by Supabase. To authenticate requests:

1. Sign up or log in to get an access token
2. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Example Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword"}'

# 3. Use the returned token for authenticated requests
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🌐 Deploying to Cloudways

### Prerequisites

- Cloudways account
- Node.js application server set up on Cloudways

### Deployment Steps

1. **Connect to your Cloudways server via SSH**

2. **Navigate to your application directory**

   ```bash
   cd /home/master/applications/your-app
   ```

3. **Clone or upload your repository**

   ```bash
   git clone https://github.com/dioscarr/Topapi.git .
   ```

4. **Install dependencies**

   ```bash
   npm install --production
   ```

5. **Configure environment variables**

   Create a `.env` file with your production values:

   ```bash
   nano .env
   ```

6. **Set up PM2 for process management**

   ```bash
   npm install -g pm2
   pm2 start api/server.js --name topapi
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx (if needed)**

   Update your Nginx configuration to proxy requests to your Node.js application:

   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

8. **Restart Nginx**

   ```bash
   sudo service nginx restart
   ```

### Monitoring and Logs

```bash
# View application logs
pm2 logs topapi

# Monitor application
pm2 monit

# Restart application
pm2 restart topapi
```

## 📁 Project Structure

```
Topapi/
├── api/
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── health.js            # Health check routes
│   │   ├── profiles.js          # Profile management routes
│   │   └── users.js             # User management routes
│   ├── utils/
│   │   ├── supabase.js          # Supabase client configuration
│   │   └── swagger.js           # Swagger documentation config
│   └── server.js                # Main application entry point
├── public/
│   └── index.html               # Frontend SPA entry point
├── .env.example                 # Production environment template
├── .env.local.example           # Development environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## 🔒 Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configured to accept requests from specified origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Using express-validator for request validation
- **JWT Authentication**: Secure token-based authentication via Supabase
- **Environment Variables**: Sensitive data stored in environment variables

## 🛡️ Error Handling

The API includes comprehensive error handling:

- Custom `ApiError` class for operational errors
- Centralized error handling middleware
- Proper HTTP status codes
- Detailed error messages in development mode
- Generic error messages in production mode

## 📝 Logging

Request logging is configured with Morgan:

- **Development**: Detailed logs with `dev` format
- **Production**: Combined Apache-style logs

## 🧪 Testing

To test the API endpoints, you can use:

1. **Swagger UI** at `/api-docs`
2. **curl** commands (see examples above)
3. **Postman** or similar API testing tools

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the ISC License.

## 📧 Support

For issues or questions, please open an issue on the GitHub repository.

## 🔗 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
