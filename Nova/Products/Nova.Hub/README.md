# Nova Hub

Nova Hub is the central management interface for all Nova products, consisting of:
- **Backend**: C# ASP.NET Core Web API
- **Frontend**: React TypeScript application

## Architecture

The React frontend communicates with the C# backend via HTTP REST API calls (no longer using Tauri).

## How to Run

### 1. Start the Backend (C# API Server)

Navigate to the backend directory:
```bash
cd Nova/Products/Nova.Hub/Backend
```

**Option A: Using the batch file (Windows)**
```bash
start-backend.bat
```

**Option B: Using dotnet CLI directly**
```bash
dotnet run
```

The backend will start at:
- **API Base URL**: http://localhost:5000
- **API Documentation**: http://localhost:5000/swagger
- **Health Check**: http://localhost:5000/health

### 2. Start the Frontend (React App)

Navigate to the frontend directory:
```bash
cd Nova/Products/Nova.Hub/Frontend
```

**Option A: Using the batch file (Windows)**
```bash
start-frontend.bat
```

**Option B: Using npm directly**
```bash
npm install  # First time only
npm run dev
```

The frontend will start at:
- **Frontend URL**: http://localhost:5173

## API Endpoints

The backend provides the following REST API endpoints:

### Authentication
- `GET /api/auth/status` - Get current authentication status
- `POST /api/auth/signin` - Initiate sign-in flow
- `POST /api/auth/signout` - Sign out current user
- `POST /api/auth/callback` - Handle authentication callback

### Products
- `GET /api/products` - Get all products
- `GET /api/products/installed` - Get installed products only
- `GET /api/products/running` - Get running products only
- `GET /api/products/{id}` - Get specific product by ID
- `POST /api/products/{id}/launch` - Launch a product
- `POST /api/products/refresh` - Refresh products data

### System
- `GET /health` - Health check
- `GET /` - API information

## Frontend Features

When you click "Sign In" in the React frontend, it will send an HTTP POST request to `/api/auth/signin` on the backend.

The frontend automatically:
- Checks if the backend is available on startup
- Shows offline status if backend is unreachable
- Polls the backend for real-time updates
- Displays authentication status and user information
- Manages product data and status

## Development

- Backend runs on ASP.NET Core 8.0
- Frontend uses Vite + React + TypeScript
- API documentation available via Swagger UI
- CORS configured to allow frontend communication

## Troubleshooting

1. **Backend not starting**: Make sure .NET 8.0 SDK is installed
2. **Frontend can't connect**: Ensure backend is running on http://localhost:5000
3. **CORS errors**: Check that frontend URL is in the CORS policy (appsettings.json) 