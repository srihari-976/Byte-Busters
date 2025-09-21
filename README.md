# Byte-Busters

# 🏭 Smart Manufacturing Assistant

[![YouTube Demo](https://img.shields.io/badge/Demo-YouTube-red?logo=youtube)](https://youtu.be/WmHZmkz3LI4)

Smart Manufacturing Assistant is a full-stack system built during the **NMIT Hackathon** to streamline manufacturing operations with modern technologies like **Odoo**, **React/Next.js**, **AI predictive alerts**, and **voice-enabled shop floor updates**.  

This guide documents the **complete implementation roadmap**, from project preparation to demo execution.  

---

## 🚀 Project Scope

**Core Modules (MVP):**
- Dashboard  
- Manufacturing Orders (MO)  
- Work Orders (WO)  
- Bills of Materials (BOM)  
- Stock Ledger  
- Reports  

**Innovation Layer:**
- AI predictive alerts  
- Voice-enabled updates  

---

## 🛠️ Tech Stack

- **Backend**: Odoo (Python, PostgreSQL)  
- **Frontend**: React / Next.js  
- **AI/ML**: Python (scikit-learn, pandas, numpy)  
- **Hosting**: Vercel (frontend), Render/Railway/AWS (backend)  
- **Integration**: Odoo REST APIs + custom endpoints  

---

## 👥 Team Roles

| Member     | Role                 | Responsibilities |
|------------|----------------------|------------------|
| **Adarsh** | Backend + AI         | Odoo integration, REST APIs, Stock Ledger, AI prediction module |
| **Srihari**| Core Business Logic  | MO & WO workflow, BOM calculation, Work Center ops |
| **Tejaswini** | Frontend + UI/UX | Dashboard, filtering, reporting UI, responsiveness |
| **Vaishnavi** | Testing + Demo    | QA, report exports, demo scripting, end-to-end testing |

---

## 📑 Implementation Phases

### Phase 0: Preparation
- Define project scope  
- Assign roles  
- Set up tools (Odoo, PostgreSQL, React/Next.js, Python env, GitHub repo)  
- Communication tools: Slack/Discord + Google Drive  

### Phase 1: Authentication & Access
- Role-based dashboards (Manager, Operator, Inventory, Admin)  
- Secure login + OTP for password reset  

### Phase 2: Core Manufacturing Modules
- **Manufacturing Orders (MO):** CRUD, BOM linkage, status sync  
- **Bills of Materials (BOM):** Auto-scale components per product  
- **Work Orders (WO):** Track assembly, painting, packaging with Start/Pause/Complete actions  
- **Work Centers:** Track utilization, downtime, and costs  

### Phase 3: Stock Ledger & Product Master
- Real-time inventory sync after WO completion  
- Stock in/out system for raw and finished goods  

### Phase 4: Dashboard & Reporting
- Real-time MO list, KPIs, component availability  
- Analytics: throughput, delays, resource utilization  
- Export reports (Excel/PDF)  

### Phase 5: AI-Powered Predictive Alerts
- Train ML models (Isolation Forest, Random Forest, LSTM)  
- Predict delays & stock shortages  
- Risk highlighting & notifications  

### Phase 6: Voice-Enabled Shop Floor Updates
- Speech-to-text integration (Google Speech API / Vosk / Whisper)  
- Hands-free WO updates with natural commands  

### Phase 7: Scalability & Additional Modules
- Quality check, predictive maintenance, IoT integration  
- Notifications via email/SMS/push  

### Phase 8: Testing & Validation
- Unit, integration, and stress testing  
- User acceptance testing with factory workflow simulation  

### Phase 9: Demo & Presentation
- Story-driven demo (factory pain → solution flow)  
- Highlight AI alerts + voice control  
- Reports & KPIs wrap-up  

---

## 📊 Key Notes
- Deliver MVP first, then add innovations  
- Agile approach: daily task tracking  
- Modular, well-documented code for flexibility  
- Clean UI/UX for maximum impact  

---

## 🎥 Demo
👉 Watch the full demo here: [YouTube Link](https://youtu.be/WmHZmkz3LI4)

---

## 📌 License
This project was developed for **NMIT Hackathon**. Feel free to fork, learn, and extend.  
