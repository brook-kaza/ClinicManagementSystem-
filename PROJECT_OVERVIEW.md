# Project Overview & Deployment Status

This document provides a comprehensive summary of the **Hani Dental Clinic Management System** and its associated **n8n** automation engine as of March 26, 2026.

## 🚀 Deployment Environment
- **Server**: Hetzner VPS (Ubuntu-based)
- **Public IP**: `128.140.88.200`
- **Architecture**: Multi-container Docker Orchestration (Docker Compose)
- **Access Model**: Port-based (Direct IP access via Nginx Proxy)
- **Deployment Automation**: `fresh_deploy.ps1` (One-click VPS deployment from local machine)

## 🛠️ Technology Stack
- **Backend**: FastAPI (Python 3.11) with SQLAlchemy ORM
- **Frontend**: React (Vite) with Axios and Vanilla CSS (Hardened with glassmorphism & premium UI)
- **Database**: PostgreSQL 15 (Optimized with `pool_size=20`, `max_overflow=50`)
- **Proxy/Web Server**: Nginx (Alpine-based, serves frontend + SSL ready)
- **Automation**: n8n (Reliable background workflow automation)

## 🏗️ Core Clinical Features
- **Appointment Scheduler**: Reusable `BookingModal`, slot availability calculation, timezone-aware comparison (fixed).
- **Patient Management**: `ClinicalHub` with one-click quick booking, medical alert banners, and profile editing.
- **Document Generation**: 
    - **Structured Prescriptions**: Multi-row drug/dosage builder with professional PDF generation.
    - **Consent Forms**: Single-page A4 Orthodontic and Tooth Removal consents with legal/risk disclosures.
    - **Sick Leaves & Referrals**: Professional clinic-branded PDF exports.
- **Finance & Inventory**: Invoice system, billing history, and stock tracking.

## 🔐 Security & Robustness Status (Hardened)
- **Auth Model**: JWT access tokens stored in **`HttpOnly` Secure Cookies** (No `localStorage` risk).
- **Password Safety**: Bcrypt hashing increased to **12 rounds**.
- **CORS Protection**: Whitelisting only `128.140.88.200` and `localhost` via `.env` `ALLOWED_ORIGINS`.
- **Database Safety**: 
    - Race-condition prevention on patient creation with automatic retry logic.
    - N+1 query optimization via lean schemas for listings.
- **Timezone Resilience**: Pure UTC-naive timestamps used throughout to prevent serialization crashes.

## 📍 Access Matrix
| Component | URL | Port |
| :--- | :--- | :--- |
| **User Dashboard** | `http://128.140.88.200` | 80 |
| **API Backend** | `http://128.140.88.200/api` | Proxied via Nginx |
| **n8n Workflow** | `http://128.140.88.200:5678` | 5678 |

---
*Last Updated: 2026-03-26 (System Hardened & Perfected)*
