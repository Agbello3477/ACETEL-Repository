# ACETEL Digital Thesis Repository System (ADTRS)

A secure and robust digital repository for managing, searching, and archiving academic theses for ACETEL (NOUN).

## Features

### 1. Student Portal

- **Dashboard**: Track thesis submission status (Draft, Submitted, Approved).
- **Submission**: Submit thesis details with integrity-hashed PDF uploads.
- **Edit**: Edit submissions while they are in 'Draft' or 'Submitted' status.

### 2. Admin Portal

- **Dashboard**: Overview of repository stats (Total, Pending, Approved).
- **Workflow**: Review submissions, Approve (Immutable), or Lock (Rejected).
- **Legacy Upload**: Tools to digitize and upload historical theses on behalf of students.
- **Analytics**: Visual charts for Thesis Distribution by Year and Programme.

### 3. Public Access

- **Landing Page**: Public search for approved theses.
- **Document Viewer**: Embedded PDF viewing for approved documents.
- **API**: Public REST endpoints for integration.

### 4. Security

- **Role-Based Access Control (RBAC)**: Strict separation of Student, Centre Admin, and Super Admin.
- **Rate Limiting**: Protection against API abuse.
- **Audit Logs**: Immutable log of all critical system actions.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Recharts.
- **Backend**: Node.js, Express, PostgreSQL (node-postgres), Bcrypt.

## Setup & Running

1. **Install Dependencies**

   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

2. **Environment Variables**
   Ensure `.env` in `backend/` is configured with DB credentials and JWT Secret.

3. **Run Development Servers**

   ```bash
   # Backend (Port 5001)
   cd backend && npm run dev
   
   # Frontend (Port 5173)
   cd frontend && npm run dev
   ```

4. **Access**
   - Public: `http://localhost:5173/`
   - Admin Login: `/login` (Default admin credentials required)
