# Local Network Deployment Guide 📡

This guide explains how to start the Healthcare Web App and access it from other devices (like your phone) on your local network.

## 1. Environment Verification

Ensure your IP address is correctly set in the environment files. Based on our configuration, your LAN IP is **`192.168.0.175`**.

### Backend Configuration (`server/.env`)
```
PORT=5001
CLIENT_URL=http://localhost:3000,http://192.168.0.175:3000
```

### Frontend Configuration (`client/.env.production`)
```
REACT_APP_API_URL=http://192.168.0.175:5001/api
```

---

## 2. Starting the Application

We have standardized all scripts to use **Port 5001** for the backend to avoid conflicts.

### Quick Start (Recommended)
Run the following from the project root:
```bash
bash startup-complete.sh
```
This will automatically clean up old processes and start both the backend and frontend.

---

## 3. Accessing from Other Devices

Once the scripts are running, you can access the app from any device on the same Wi-Fi:

- **Frontend**: `http://192.168.0.175:3000`
- **Backend Health Check**: `http://192.168.0.175:5001/api/health`

### 📱 Special Steps for Mobile WebRTC (Camera/Mic)
Mobile browsers block camera/mic access on `http` sites (except localhost). To enable video consultations on your phone:

1.  Open **Chrome** on your phone.
2.  Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
3.  **Enable** the flag.
4.  Enter `http://192.168.0.175:3000` in the text box.
5.  Relaunch Chrome.

---

## 4. Development vs. Production Mode

| Feature | Development (`npm start`) | Production (`npm run build`) |
| :--- | :--- | :--- |
| **Speed** | Fast hot-reloading | Optimized & Faster load times |
| **API Pointer** | Uses `localhost:5001` | Uses `192.168.0.175:5001` |
| **Stability** | Best for coding | Best for multi-device testing |

**To run in "Production-like" mode locally:**
1. Build the client: `npm -C client run build`
2. Serve the build: `npx serve -s client/build -l 3000`
3. Start the backend as usual: `npm -C server start`
