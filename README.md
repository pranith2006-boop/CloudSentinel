# Cloud Sentinel Testing Dashboard

An interactive web application that simulates a cloud portal and automatically validates workflow requests with integrated test reporting.

## Features
- Landing page with product overview
- Authentication (login/register)
- Cloud portal to submit VM and storage requests
- Automatic unit/integration test execution on each request
- Dashboard with pass/fail metrics, coverage, and historical trends
- Request history feed and performance monitoring

## Run locally
1. Open a terminal in the project folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open http://localhost:4000 in your browser

## Default credentials
- Username: `admin`
- Password: `Admin123!`

## Notes
- The backend stores data in a local SQLite database file `data.db`
- Each new request triggers automated validation tests and updates the dashboard history
- Use the portal page to submit requests and the dashboard to inspect analytics
