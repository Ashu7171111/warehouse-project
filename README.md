# 📦 RouteFlow — Warehouse Delivery Route Optimizer

> AI-powered logistics dashboard using **TSP optimization** (Google OR-Tools) to find the shortest delivery route across multiple stops.

![RouteFlow](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20OR--Tools-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🗺️ **Route Optimizer** | TSP solved via Google OR-Tools + 2-opt fallback |
| 🗺️ **Interactive Map** | Leaflet.js + OpenStreetMap with numbered stop markers |
| 📊 **Analytics Dashboard** | Line/bar charts for distance and fuel cost trends |
| 📋 **Route History** | Session-based table of all optimization runs |
| 📄 **PDF Export** | One-click route report download |
| 🌙 **Dark Mode** | Toggle between light and dark themes |
| 📱 **Responsive** | Works on mobile, tablet, and desktop |

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** — utility-first styling
- **Leaflet.js** + **react-leaflet** — interactive maps
- **Recharts** — analytics charts
- **jsPDF** — PDF report export
- **Axios** — API client

### Backend
- **FastAPI** — async Python API
- **Google OR-Tools** — TSP solver (with nearest neighbor + 2-opt fallback)
- **Pydantic v2** — data validation
- **Uvicorn** — ASGI server

---

## 📁 Project Structure

```
warehouse-optimizer/
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx          # Root layout + dark mode context
│   │   └── page.tsx            # Main dashboard page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ResultPanel.tsx
│   │   │   ├── HistoryTable.tsx
│   │   │   └── Analytics.tsx
│   │   ├── forms/
│   │   │   └── RouteForm.tsx
│   │   ├── map/
│   │   │   └── MapView.tsx
│   │   └── ui/
│   │       └── StatCard.tsx
│   ├── lib/
│   │   ├── api.ts              # Axios API client
│   │   └── pdf.ts              # PDF export utility
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
└── backend/
    ├── main.py                 # FastAPI app + TSP solver
    ├── requirements.txt
    ├── Dockerfile
    └── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- **pip** or **pipenv**

---

### 1. Clone the repo

```bash
git clone https://github.com/yourname/warehouse-optimizer.git
cd warehouse-optimizer
```

---

### 2. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Start server
uvicorn main:app --reload --port 8000
```

API will be live at: **http://localhost:8000**

Swagger docs: **http://localhost:8000/docs**

---

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Frontend will be live at: **http://localhost:3000**

---

## 🔌 API Reference

### `POST /optimize-route`

Solves the Travelling Salesman Problem for the given warehouse and delivery locations.

**Request:**
```json
{
  "warehouse": {
    "name": "Main Warehouse",
    "lat": 22.7196,
    "lng": 75.8577
  },
  "locations": [
    { "name": "Stop A", "lat": 22.7352, "lng": 75.8412 },
    { "name": "Stop B", "lat": 22.7058, "lng": 75.8734 },
    { "name": "Stop C", "lat": 22.7446, "lng": 75.9012 }
  ],
  "speed": 40,
  "fuel_cost": 8
}
```

**Response:**
```json
{
  "route": ["Main Warehouse", "Stop A", "Stop C", "Stop B", "Main Warehouse"],
  "route_stops": [
    { "name": "Main Warehouse", "lat": 22.7196, "lng": 75.8577, "order": 0 },
    ...
  ],
  "distance": 18.4,
  "time": "27 min",
  "fuel_cost": 147.2,
  "stops_count": 3,
  "timestamp": "2024-01-15T10:30:00"
}
```

**Constraints:**
- Maximum 25 delivery locations
- Minimum 1 delivery location

---

## 🧮 Optimization Algorithm

1. **Primary**: Google OR-Tools (if installed) using `PATH_CHEAPEST_ARC` + Guided Local Search with 5s time limit
2. **Fallback**: Nearest Neighbor heuristic → **2-opt local search** improvement

Distance is calculated using the **Haversine formula** for accurate geodesic distance.

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Deploy via Vercel CLI or GitHub integration
vercel deploy
```

Set environment variable in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a **Web Service** pointing to `/backend`
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set environment variable: `PORT=8000`

### Backend → Docker

```bash
cd backend
docker build -t routeflow-api .
docker run -p 8000:8000 routeflow-api
```

---

## 🧪 Testing the API

```bash
curl -X POST http://localhost:8000/optimize-route \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse": {"name": "WH", "lat": 22.72, "lng": 75.85},
    "locations": [
      {"name": "A", "lat": 22.73, "lng": 75.84},
      {"name": "B", "lat": 22.75, "lng": 75.88},
      {"name": "C", "lat": 22.70, "lng": 75.87}
    ],
    "speed": 40,
    "fuel_cost": 8
  }'
```

---

## 📸 Screenshots

| Dashboard | Route Optimizer | Analytics |
|---|---|---|
| Stats overview, quick actions | Form + Map + Results | Charts and history |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Google OR-Tools](https://developers.google.com/optimization) — Optimization engine
- [OpenStreetMap](https://www.openstreetmap.org/) — Map tiles
- [Leaflet.js](https://leafletjs.com/) — Interactive maps
- [Recharts](https://recharts.org/) — React charts
