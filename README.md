# 🍲 Food Rescue Intelligence (FRI)
> **A Smart Surplus Food Redistribution & NGO Coordination Platform**  
> *Academic Project — Department of Computer Science & Engineering, IET Lucknow (Group No. 15)*

---

## 📌 Overview

Every day, vast amounts of edible cooked food from university canteens, college messes, banquet halls, and restaurants are discarded due to volatile daily attendance and narrow safe consumption windows (4–6 hours). Meanwhile, millions suffer from food insecurity.

**Food Rescue Intelligence (FRI)** is a real-time, authenticated web platform designed to eliminate communication latency and bridge food donors directly with verified NGOs, orphanages, and shelter homes before perishable food degrades.

---

## 🚀 Key Features

* **🔐 Multi-Tier Secure Authentication:**
  * Multi-role onboarding: `donor`, `ngo`, `volunteer`, `admin`.
  * Dual Two-Factor Authentication (2FA) via **Email OTP** (Nodemailer) and **SMS OTP**.
  * Instant verified sign-in via **Google OAuth 2.0**.
  * Session protection using encrypted **JWT HTTP-only cookies** and salted **Bcrypt** hashing.
* **🏢 Organization Entity Decoupling:**
  * Clean separation of personal user credentials from business/charity entity profiles.
  * Native **GeoJSON (`2dsphere`) spatial indexing** for rapid distance calculations.
* **🧠 AI & Weighted Matching Algorithm:**
  * Evaluates donation urgency, spatial proximity, and recipient intake capacity:
    $$\text{Match Score} = (0.45 \times \text{Proximity}) + (0.35 \times \text{Urgency}) + (0.20 \times \text{Capacity})$$
* **🤝 Fraud-Proof Handshake Verification (OTP):**
  * When an NGO claims food, a unique 4-digit **Pickup Handshake OTP** is generated. The donor validates the OTP physically at pickup, preventing food diversion.
* **📜 Immutable Status Event Audit Trail:**
  * Event-sourcing history tracking each transition (`available` ➔ `reserved` ➔ `picked_up` ➔ `delivered`) with timestamps and user accountability.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    Donor["1. Food Donor (Canteen/Hotel)"] -->|Posts Surplus Food & Deadline| Server["FRI Backend API (Node/Express)"]
    Server -->|Computes Urgency & Proximity Radius| GeoEngine["AI Matching & Dispatch Engine"]
    GeoEngine -->|Instant Alert Notification| NGO["2. Verified NGOs & Shelters"]
    NGO -->|Accepts / Claims Donation| Server
    Server -->|Generates Handshake Pickup OTP| Handshake["3. Verification Handshake"]
    Handshake -->|Donor validates OTP at Pickup| Dispatch["Picked Up Status Logged"]
    Dispatch -->|Delivered to Beneficiaries| Complete["Delivered & Impact Recorded"]
```

---

## 🗄️ Database Architecture (Mongoose Models)

| Model | Purpose | Key Attributes |
| :--- | :--- | :--- |
| **`User`** | Identity & Access Control | `name`, `email`, `role`, `password`, `isEmailVerified`, `emailOtp`, `phoneOtp`, `googleId` |
| **`Organization`** | Business / NGO Profile | `user` (ref), `name`, `type` (`donor`/`ngo`), `address`, `city`, `location` (GeoJSON Point), `isVerified` |
| **`FoodListing`** | Surplus Food Donations | `organization`, `donorUser`, `foodName`, `dietaryType`, `quantity`, `unit`, `preparedAt`, `pickupDeadline`, `status` |
| **`Match`** | System AI Recommendations | `foodListing`, `ngoOrganization`, `matchScore` (0–100), `status` (compound unique index) |
| **`DonationRequest`**| NGO Formal Claim | `foodListing`, `ngoOrganization`, `ngoUser`, `pickupOtp`, `status` (`pending`, `approved`, etc.) |
| **`StatusEvent`** | Audit History & Compliance | `foodListing`, `oldStatus`, `newStatus`, `changedBy` (ref User), `changedAt`, `notes` |

---

## 🛠️ Tech Stack

* **Frontend:** React.js 18, Vite 5, Tailwind CSS, Lucide React, Axios, React Router DOM v6
* **Backend:** Node.js, Express.js (REST API Architecture)
* **Database:** MongoDB Atlas (Mongoose ODM with `2dsphere` indexes)
* **Authentication:** JWT, Bcrypt.js, Google OAuth 2.0 (`google-auth-library`), Nodemailer
* **Intelligence Layer:** Rule-based shelf-life urgency scoring, Haversine formula for spatial distance, CO₂ & water ROI calculations

---

## 💻 Frontend Application Structure

The user interface is structured with modern, responsive single-page architecture:

* **🏠 Landing Page (`/`):** Live impact metrics counter (meals saved, kg diverted, CO₂ cut), 4-step workflow explainer, urgent food teaser, and interactive **Eco-Savings ROI Calculator**.
* **🍱 Surplus Food Feed (`/feed`):** Public browse with real-time filters (category, dietary type, urgency level) and 1-click **Claim for Shelter** modal.
* **🔑 Authentication (`/login`, `/register`):** Role-specific login with 2FA OTP verification, **1-click Demo Fill buttons**, and browser GPS geolocation auto-detection.
* **📦 Donor Dashboard (`/donor`):** Surplus batch posting with instant AI urgency & impact preview, active listing tracker, and **Handover OTP Verification Modal**.
* **🤝 NGO Shelter Dashboard (`/ngo`):** Nearby canteen surplus batches, active claims view with large **4-digit Handshake OTP** display for drivers, and pickup history.
* **⚡ Admin Control Console (`/admin`):** Platform governance, pending organization license approvals, and user account role management.

---

## ⚡ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aadipanday/Food-Rescue-Intelligence.git
   cd Food-Rescue-Intelligence
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file inside the `backend/` directory (refer to `backend/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173,http://localhost:3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/food_rescue_intelligence
   JWT_SECRET=super_secret_production_jwt_key_min_32_characters_long
   GOOGLE_CLIENT_ID=your_google_client_id_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Seed Database with Sample Organizations & Donations:**
   ```bash
   cd backend
   npm run seed
   ```

5. **Run the Development Servers:**
   * **Backend API (Port 5000):**
     ```bash
     cd backend
     npm run dev
     ```
   * **Frontend Web App (Port 5173):**
     ```bash
     cd frontend
     npm run dev
     ```
   * Or from the root directory:
     ```bash
     npm run dev:backend
     npm run dev:frontend
     ```

---

## 🧪 Demo Credentials (For Evaluation & Testing)

| Role | Email | Password | Pre-seeded Facility |
| :--- | :--- | :--- | :--- |
| **Donor (Canteen)** | `canteen@ietlucknow.ac.in` | `Password123!` | IET Central Canteen (Lucknow) |
| **NGO (Shelter)** | `helpinghands@ngo.org` | `Password123!` | Helping Hands Orphanage & Shelter |
| **System Admin** | `admin@foodrescue.org` | `Password123!` | FRI Operations Console |

*(Note: The login page includes 1-click **Quick Demo Sign-In** buttons to test each role instantly without manual typing).*

---

## 👥 Project Team (Group No. 15)

* **Aditya Panday** (Roll No: `2400520100010`)
* **Devendra Singh** (Roll No: `2400520100033`)
* **Ayushman Agrahari** (Roll No: `2400520100027`)

**Project Supervisor:** Assistant Professor Nikita Gond  
**Department:** Computer Science & Engineering, **Institute of Engineering & Technology (IET), Lucknow**  
**Academic Session:** 2026 – 2027

---

## 📜 License
This project is licensed under the ISC License.
