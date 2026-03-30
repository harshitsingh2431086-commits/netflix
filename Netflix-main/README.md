# Netflix Clone

A high-fidelity Netflix clone built with React, TypeScript, Vite, Tailwind CSS, and Firebase. This project features a fully functional user interface, admin dashboard for content management, user authentication, and PWA support.

## 🚀 Features

### User Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile.
- **Authentication**: User registration and login using Firebase Auth (Google & Email).
- **Video Playback**: Custom video player with support for trailers and movies (via Google Drive integration).
- **Profiles**: Multiple user profiles (including Kids mode).
- **My List**: Add/remove content to a personal watchlist.
- **Search**: Real-time content search.
- **Downloads**: Simulated download functionality for offline viewing.
- **PWA**: Installable as a Progressive Web App.

### Admin Features
- **Dashboard Overview**: Real-time statistics on users, content, and requests.
- **Content Management**: Add, edit, and delete Movies and TV Shows.
- **Section Management**: Customize the homepage sections (Trending, New Releases, etc.).
- **User Management**: View and manage registered users.
- **Content Requests**: View and manage content requests from users.
- **Analytics**: Visualization of system events and user activity.
- **Site Settings**: Configure global site settings.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion (for animations), Lucide React (icons)
- **Backend**: Firebase (Firestore, Auth, Storage, Functions, Analytics)
- **State Management**: React Context API
- **Routing**: Custom Hash-based Routing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A [Firebase](https://firebase.google.com/) account and project.

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/netflix-clone.git
    cd netflix-clone
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory based on the following template. You need to get these values from your Firebase Project Settings.

    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    VITE_FUNCTIONS_REGION=us-central1
    VITE_ENABLE_ANALYTICS=true
    ```

4.  **Run Locally:**
    Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173`.

## 📦 Deployment

### Vercel (Recommended)
1.  Push your code to a generic GitHub repository.
2.  Import the project into Vercel.
3.  Vercel will detect Vite and set the build settings automatically (Output Directory: `dist`).
4.  Add the Environment Variables (from your `.env` file) in the Vercel Project Settings.
5.  Click **Deploy**.

### Netlify
1.  Drag and drop the `dist` folder to Netlify Drop (after running `npm run build`), or connect your GitHub repository.
2.  Set the build command to `npm run build` and publish directory to `dist`.
3.  Add Environment Variables in Site Settings > Build & deploy > Environment.

## 🛡️ Admin & Management Guide

To access the Admin Dashboard, you must log in with an account that has the `admin` role.

### Accessing the Dashboard
Navigate to `#/admin` (or click the Admin button if visible in your profile menu).

### Managing Content
1.  Go to the **Content** tab (or `#/admin/content`).
2.  Click **"Add New"** to create a new movie or TV show.
3.  Fill in the details:
    -   **Title, Description, Genes**.
    -   **Images**: Paste URLs for Poster and Backdrop.
    -   **Video Source**:
        -   **YouTube ID**: Key for the trailer (e.g., `dQw4w9WgXcQ`).
        -   **Drive ID**: The File ID from a Google Drive video link.
4.  Click **Save**.

### Managing Sections
1.  Go to the **Sections** tab (or `#/admin/sections`).
2.  You can toggle sections on/off, change their order, or edit their titles.
3.  Sections control what appears on the Homepage (e.g., "Trending Now", "Action Movies").

### User Requests
1.  Users can request content via the "Request" feature.
2.  Go to the **Requests** tab (or `#/admin/requests`) to see these.
3.  Mark them as `Resolved` once you have added the content, or `Failed` if unavailable.

### User Management
1.  Go to the **Users** tab.
2.  View list of all registered users.
3.  (Future) Manage user roles and subscriptions.

## 🔒 Security Notes
-   **DRM Simulation**: Right-click context menu is disabled to discourage simple downloading.
-   **Session Detection**: The app detects if multiple tabs are open to prevent account sharing abuse (simulated).

## 📄 License
[MIT](LICENSE)
