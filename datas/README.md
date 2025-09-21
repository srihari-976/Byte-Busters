# Smart Manufacturing Assistant

A comprehensive manufacturing management system with AI-powered insights and real-time monitoring.

## 🏗️ Architecture

```
odoo/
├── backend/           # Express.js + PostgreSQL API
│   ├── server.js      # Main server file
│   └── package.json   # Backend dependencies
└── frontend/          # React + Vite application
    ├── src/           # Source code
    ├── public/        # Static assets
    └── package.json   # Frontend dependencies
```

## 🚀 Quick Start

### 1. Database Setup
```bash
# Install PostgreSQL
# Create database: manufacturing_db
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

## 🎯 Features

### Core Modules
- **Dashboard**: Real-time KPIs and manufacturing overview
- **Manufacturing Orders**: Create, track, and manage production orders
- **Work Orders**: Step-by-step production workflow management
- **BOM Manager**: Bill of Materials with auto-scaling calculations
- **Work Centers**: Capacity tracking and utilization monitoring
- **Stock Ledger**: Real-time inventory management
- **Reports**: Production analytics and exportable reports

### Innovation Layer
- **🤖 AI Predictive Alerts**: Machine learning-based delay and shortage predictions
- **🎤 Voice Control**: Hands-free work order updates using Web Speech API
- **📊 Real-time Analytics**: Live production metrics and efficiency tracking

## 👥 Role-Based Access

- **Manager**: Full dashboard access, all modules
- **Operator**: Work order updates, limited dashboard view
- **Inventory**: Stock ledger and manufacturing order view
- **Admin**: Reports, user management, system configuration

## 🔧 Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **API**: RESTful endpoints

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: CSS3 with modern design
- **State**: React hooks + localStorage
- **Voice**: Web Speech API

## 📱 Demo Features

### Sample Data
- 3 Manufacturing Orders (Table, Chair, Desk)
- 4 Work Orders with different statuses
- Stock data with shortage alerts
- BOM definitions for products
- AI predictions for delays and bottlenecks

### Voice Commands
- "Start order MO001"
- "Complete order MO001"
- "Pause order MO001"

## 🔐 Authentication

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP verification table
CREATE TABLE otp_verification (
  otp_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  otp_code VARCHAR(6),
  expiry_time TIMESTAMP,
  used BOOLEAN DEFAULT FALSE
);
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render/AWS)
```bash
cd backend
# Set environment variables
# Deploy with PostgreSQL addon
```

## 🎨 UI/UX Features

- **Modern Design**: Glassmorphism effects and smooth animations
- **Responsive**: Mobile-first design approach
- **Notifications**: Custom toast notifications instead of alerts
- **Dark Theme Ready**: CSS variables for easy theming
- **Accessibility**: ARIA labels and keyboard navigation

## 📊 AI Predictions

The system analyzes:
- Stock levels vs requirements
- Work order bottlenecks
- Historical production data
- Resource utilization patterns
- Delivery timeline predictions

## 🔮 Future Enhancements

- **IoT Integration**: Sensor data for predictive maintenance
- **Advanced ML**: LSTM models for demand forecasting
- **Mobile App**: React Native companion app
- **Multi-tenant**: Support for multiple manufacturing facilities
- **ERP Integration**: SAP, Oracle, and other ERP connectors

## 📄 License

MIT License - Built for hackathons and production use.

---

**Built with ❤️ for smart manufacturing and Industry 4.0**