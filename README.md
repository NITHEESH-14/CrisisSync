# CrisisSync

CrisisSync is a comprehensive **Real-Time Crisis Management and Emergency Response Platform** designed to streamline communication and coordination during emergencies. It bridges the gap between distressed individuals, volunteers, organizations, and emergency services through a live, interactive dashboard.

### 🔗 **Live Demo:** [crisisync.vercel.app](https://crisisync.vercel.app)

## 🚀 Features

### 🚨 Real-Time Crisis Reporting
*   **Instant Reporting**: Users can quickly report various types of emergencies:
    *   Fire
    *   Medical
    *   Violence / Panic
    *   Accident
    *   Natural Disaster
*   **Location Tracking**: Automatically captures and shares precise location data (Latitude/Longitude) for accurate response.

### 📊 Live Operations Dashboard
*   **Active Incident Feed**: A real-time feed of all ongoing crises, sorted by urgency and time.
*   **Status Tracking**: Monitor the lifecycle of an incident from `Pending` → `Acknowledged` → `Resolved`.
*   **Interactive Maps**:
    *   Integration with **Google Maps** for navigation to incident sites.
    *   **Live Risk Map**: Embedded Windy.com visualization for weather and environmental risk assessment *only for a sample.
*   **Stats Overview**: Live counters for Active Incidents, Total Responders, and Resolved Cases.

### 🤝 Volunteer & Organization Coordination
*   **Volunteer Response**: Registered volunteers can "Join" an emergency response directly from the dashboard, updating the on-site responder count in real-time.
*   **Organization Pledges**: Validated organizations can pledge multiple members or resources to specific incidents, ensuring large-scale crises get adequate manpower.

### 🔔 Smart Notifications
*   **Automated Routing**: The system automatically identifies and notifies the relevant authorities based on the emergency type (e.g., Fire Dept for fires, Ambulance for medical).
*   **Resolution Logs**: Detailed logging of resolution actions for auditing and future reference.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **UI Library**: [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
*   **Language**: TypeScript
*   **Maps & Data**: Leaflet / React-Leaflet, Windy API for experimental purpose

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/CrisisSync.git
    cd CrisisSync
    ```

2.  **Navigate to the web directory**
    The frontend application is located in the `web` folder.
    ```bash
    cd web
    ```

3.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Environment Setup**
    Create a `.env.local` file in the `web` directory with your Firebase configuration keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📂 Project Structure

```
CrisisSync/
├── web/                  # Main Frontend Application
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable UI Components
│   │   ├── DashboardView.tsx   # Main Operations Center
│   │   ├── ReportWizard.tsx    # Emergency Reporting Flow
│   │   ├── EmergencyActions.tsx
│   │   └── ...
│   ├── lib/             # Utilities (Firebase config, helpers)
│   └── public/          # Static assets
└── README.md            # Project Documentation
```

  
