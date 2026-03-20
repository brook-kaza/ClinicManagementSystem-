# Project Overview & Deployment Status

This document provides a comprehensive summary of the **Hani Dental Clinic Management System** and its associated **n8n** automation engine as of March 19, 2026.

## 🚀 Deployment Environment
- **Server**: Hetzner VPS (Ubuntu-based)
- **Public IP**: `46.225.86.61`
- **Architecture**: Multi-container Docker Orchestration (Docker Compose)
- **Access Model**: Port-based (Direct IP access)

## 🛠️ Technology Stack
- **Backend**: FastAPI (Python 3.11) with SQLAlchemy ORM
- **Frontend**: React (Vite) with Axios and TailwindCSS/Vanilla CSS
- **Database**: PostgreSQL 15 (Single cluster with isolated `clinic_db` and `n8n_db` databases)
- **Proxy/Web Server**: Nginx (Alpine-based)
- **Automation**: n8n (Version: Latest)

## 🏗️ System Architecture
The project is split into 5 core services managed by `docker-compose.yml`:
1.  **`db`**: The central PostgreSQL database holding all clinical and automation data.
2.  **`clinic-backend`**: The FastAPI server handling business logic, authentication, and data API.
3.  **`frontend`**: A build-stage container that compiles the React app into static files.
4.  **`n8n`**: A dedicated workflow automation platform with a 1.5GB RAM limit.
5.  **`proxy`**: An Nginx server that routes web traffic (Port 80) and serves front-end assets.

## 🔐 Key Security & Robustness Features
-   **Self-Healing Admin**: The backend is configured to automatically recreate an `Admin` user if the database is empty or the user is missing.
-   **Hardened Storage**: Persistent Docker Volumes for the database (`postgres_data`) and n8n configurations (`n8n_data`).
-   **Environment Control**: `.env` used for all secrets; `ALLOWED_ORIGINS` configured to whitelist only the server IP and local dev.
-   **Clean Build**: `.dockerignore` prevents source-code junk (like `.git`) from entering production images.

## 📍 Access Matrix
| Component | URL | Port |
| :--- | :--- | :--- |
| **User Dashboard** | `http://46.225.86.61` | 80 |
| **API Backend** | `http://46.225.86.61:8000` | 8000 |
| **n8n Workflow** | `http://46.225.86.61:5678` | 5678 |

### Default Admin (Seeded)
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Admin`

## 📅 Maintenance & Backups
-   **Persistence**: Verified. Data survives container restarts and upgrades.
-   **Automated Backups**: *Pending Implementation* (Manual backups via `pg_dump` recommended for now).

---
*Last Updated: 2026-03-19*
