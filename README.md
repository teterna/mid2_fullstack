# PEX - The Personal Exchange

PEX is a beginner-friendly MERN-style project where every user can become a public company, issue one ticker, trade shares, and see prices update live through native WebSockets.

## What This Project Uses

- Backend: Node.js, Express, Mongoose, `ws`
- Frontend: React + Vite
- Database: MongoDB
- Auth: JWT
- Realtime rule: native WebSockets only, no Socket.io

## Important Project Rules Covered

- The WebSocket connection sends the JWT through the `Sec-WebSocket-Protocol` header:

```js
new WebSocket(WS_URL, token);
```

- The backend broadcasts price updates in the required shape:

```json
{
  "type": "TICKER_UPDATE",
  "payload": {
    "ticker": "XYZ",
    "price": 155.2
  }
}
```

- Total valuation is never stored in MongoDB. The React app calculates it live:

```txt
wallet balance + shares held * current websocket price
```

- There is no polling for prices.

## Local Setup

Use Node.js `20.19+` or `22.12+`.

### 1. Install Dependencies

From the project root:

```bash
npm run install:all
```

### 2. Create Backend Environment File

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Fill it in:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/pex
JWT_SECRET=some_long_secret_string
CLIENT_URL=http://localhost:5173
```

MongoDB Atlas is recommended because the buy/sell logic uses MongoDB transactions.

### 3. Create Frontend Environment File

Create `frontend/.env` from the example:

```bash
cp frontend/.env.example frontend/.env
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

### 4. Run the Project

Open two terminals.

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Open:

```txt
http://localhost:5173
```

## API Map

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Stocks

- `GET /api/stocks`
- `POST /api/stocks`
- `PUT /api/stocks/:ticker/price`
- `DELETE /api/stocks/:ticker`

Only the stock owner can update the price or delete the ticker. If another user tries it, the API returns `403 Forbidden`.

### Trades

- `POST /api/trades/buy`
- `POST /api/trades/sell`

## Deploy Backend to Render

### 1. Push Project to GitHub

Create a GitHub repository and push this project.

### 2. Create a MongoDB Atlas Database

1. Go to MongoDB Atlas.
2. Create a free cluster.
3. Create a database user.
4. Add your IP address for local testing.
5. For deployment, allow access from Render by adding `0.0.0.0/0` in Network Access.
6. Copy the connection string.

### 3. Create a Render Web Service

1. Go to Render.
2. Click `New +`.
3. Choose `Web Service`.
4. Connect your GitHub repository.
5. Set the root directory:

```txt
backend
```

6. Set build command:

```bash
npm install
```

7. Set start command:

```bash
npm start
```

8. Add environment variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=https://your-vercel-project.vercel.app
```

9. Deploy.

Your backend URL will look like:

```txt
https://pex-backend.onrender.com
```

## Deploy Backend to Railway

Railway is an alternative to Render.

1. Create a new Railway project.
2. Connect your GitHub repo.
3. Set the service root directory to `backend`.
4. Add the same environment variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=https://your-vercel-project.vercel.app
```

5. Railway usually detects Node automatically.
6. Make sure the start command is:

```bash
npm start
```

## Deploy Frontend to Vercel

### 1. Import Project

1. Go to Vercel.
2. Click `Add New Project`.
3. Import the same GitHub repository.
4. Set framework preset to `Vite`.
5. Set root directory:

```txt
frontend
```

### 2. Add Environment Variables

Use your deployed backend URL.

For Render:

```env
VITE_API_URL=https://pex-backend.onrender.com/api
VITE_WS_URL=wss://pex-backend.onrender.com/ws
```

For this project name, the production values would look like:

```env
VITE_API_URL=https://mid2-fullstack.onrender.com/api
VITE_WS_URL=wss://mid2-fullstack.onrender.com/ws
```

For Railway:

```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
VITE_WS_URL=wss://your-railway-app.up.railway.app/ws
```

### 3. Deploy

Vercel build command:

```bash
npm run build
```

Vercel output directory:

```txt
dist
```

## Final Production Check

After both apps are deployed:

1. Copy the Vercel frontend URL.
2. Put that URL into the backend `CLIENT_URL` variable on Render or Railway.
3. Redeploy the backend.
4. Register two users.
5. Create one ticker from each user.
6. Open the app in two browser windows.
7. Change the owner price in one window.
8. The other window should update instantly without refresh.

Example Render backend variable:

```env
CLIENT_URL=https://mid2-fullstack.vercel.app
```

If you need several frontend URLs, separate them with commas:

```env
CLIENT_URL=http://localhost:5174,https://mid2-fullstack.vercel.app
```
