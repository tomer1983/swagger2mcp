# Manual UI Testing Guide for Admin Dashboard

Since the automated browser tools are currently unavailable, please perform the following manual tests to verify the new Admin Dashboard features.

## Prerequisites

- Ensure the application is running (`docker-compose up`).
- Frontend URL: [http://localhost:5173](http://localhost:5173)

## Test Scenarios

### 1. Admin Login

1. Navigate to [http://localhost:5173/login](http://localhost:5173/login).
2. Enter Credentials:
   - **Email**: `admin@test.com`
   - **Password**: `adminpass123`
3. Click **Login**.
4. **Expected Result**: You should be redirected to `/admin` (Admin Dashboard). A "Login successful" toast may appear.

### 2. Admin Dashboard (Metrics)

1. Verify you are on the **Dashboard** tab (default).
2. Check **System Metrics**:
   - CPU Usage (percentage)
   - Memory Usage (percentage)
   - Uptime (time string)
3. Check **Quick Stats**:
   - Total Users
   - Total Schemas
   - Active Jobs
4. **Expected Result**: All metrics should display values (not "Loading...").

### 3. User Management

1. Click **Users** in the sidebar.
2. Verify the list of users is displayed.
3. You should see at least the `admin` user.
4. **Action**: Click the **Edit** (pencil) icon on a user.
5. **Expected Result**: The "Edit User" modal opens with user details pre-filled.
6. Close the modal.

### 4. System Configuration

1. Click **Configuration** in the sidebar.
2. Verify the list of configuration keys (e.g., `MAX_UPLOAD_SIZE`, `CRAWL_DEPTH_LIMIT`).
3. **Action**: Click **Edit** on `CRAWL_DEPTH_LIMIT`.
4. Change the value (e.g., from `3` to `5`) and click **Save**.
5. **Expected Result**: The value updates in the list, and a success toast appears.

### 5. Audit Logs

1. Click **Audit Logs** in the sidebar.
2. Verify the table loads with recent events.
3. You should see a `USER_LOGIN` event corresponding to your recent login.
4. **Action**: Click **Export JSON**.
5. **Expected Result**: A `.json` file containing the logs is downloaded.
6. **Action**: Click the **Expand** (down arrow) icon on a log entry.
7. **Expected Result**: The JSON details of the event are displayed.

## Troubleshooting

- If pages stick on "Loading...", check the browser console (F12) for network errors.
- If the login fails, ensure the backend is running and the database is seeded (`npx prisma db seed` was run automatically, but can be re-run if needed).
