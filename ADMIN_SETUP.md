# Vitacoin Admin Interface Setup

This document explains how to set up and use the admin interface for the Vitacoin application.

## Features

### Admin Dashboard
- **Overview**: View system statistics including total users, active challenges, active games, and total coins distributed
- **Challenge Management**: Create, edit, activate/deactivate challenges
- **Game Management**: Add, edit, activate/deactivate games
- **User Management**: View user details, manage user status
- **Settings**: Configure system parameters and maintenance mode

### User Interface (Non-Admin)
- **Play Games**: Access to all active games to earn coins
- **Challenges**: View and participate in active challenges
- **Dashboard**: Regular user dashboard without admin features

## Setup Instructions

### 1. Create Admin User

First, create an admin user in the database:

```bash
cd backend
npm run create-admin
```

This will create an admin user, or **reset password and role** if `admin@vitacoin.com` already exists (fixes “Invalid credentials” after a bad password or role change):

- Email: `admin@vitacoin.com`
- Password: `admin123`
- Role: `admin`

### 2. Start the Application

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm start
```

### 3. Login as Admin

1. Navigate to `http://localhost:3000/login`
2. Login with admin credentials:
   - Email: `admin@vitacoin.com`
   - Password: `admin123`

## Usage

### Admin Users

After logging in as an admin, you'll see:
- **Admin Dashboard** in the sidebar instead of regular user options
- Access to all admin functions
- No access to play games or spend coins

#### Managing Challenges
1. Go to **Challenges** tab in admin dashboard
2. View all challenges (active and inactive)
3. Toggle challenge status (activate/deactivate)
4. Create new challenges
5. Edit existing challenges

#### Managing Games
1. Go to **Games** tab in admin dashboard
2. View all games
3. Toggle game status (activate/deactivate)
4. Add new games
5. Edit existing games

#### User Management
1. Go to **Users** tab in admin dashboard
2. View all users and their details
3. Toggle user status (activate/deactivate)
4. View user statistics and transactions

### Regular Users

Regular users will see:
- **Play Games** option in the sidebar
- Access to all active games and challenges
- Regular dashboard with earning opportunities
- No admin functions

## API Endpoints

### Admin Routes (Protected)
- `GET /api/admin/stats` - Get admin dashboard statistics
- `GET /api/admin/challenges` - Get all challenges
- `PUT /api/admin/challenges/:id/toggle` - Toggle challenge status
- `GET /api/admin/games` - Get all games
- `PUT /api/admin/games/:id/toggle` - Toggle game status
- `GET /api/admin/users` - Get all users
- `POST /api/admin/challenges` - Create new challenge
- `POST /api/admin/games` - Disabled (games are coded templates; edit metadata via `PUT /api/admin/games/:id`)

### User Routes (Protected)
- `GET /api/games/active` - Get active games for users
- `GET /api/challenges/active` - Get active challenges for users

## Security

- Admin routes are protected by authentication middleware
- Only users with `role: 'admin'` can access admin functions
- Regular users cannot access admin endpoints
- All routes require valid JWT token

## Customization

### Adding New Admin Features
1. Add new routes in `backend/routes/admin.js`
2. Add corresponding UI components in `frontend/src/pages/Admin/`
3. Update the admin navigation in `frontend/src/components/Layout/Layout.js`

### Modifying User Interface
1. Update components in `frontend/src/pages/Games/`
2. Modify user dashboard in `frontend/src/pages/Dashboard/`
3. Update navigation based on user role

## Troubleshooting

### Common Issues

1. **Admin user not created**: Ensure MongoDB is running and connection string is correct
2. **Admin routes not accessible**: Check that user role is set to 'admin' in database
3. **Frontend not showing admin interface**: Verify user authentication and role in AuthContext

### Debug Commands

```bash
# Check MongoDB connection
cd backend
npm run dev

# Check admin user in database
mongo vitacoin
db.users.findOne({role: 'admin'})
```

## File Structure

```
frontend/src/
├── pages/
│   ├── Admin/
│   │   └── AdminDashboard.js
│   └── Games/
│       └── PlayGames.js
├── components/
│   └── Layout/
│       └── Layout.js
└── App.js

backend/
├── routes/
│   └── admin.js
├── scripts/
│   └── createAdmin.js
└── server.js
```

## Support

For issues or questions about the admin interface, check:
1. Backend logs for API errors
2. Frontend console for JavaScript errors
3. Database connection and user authentication
4. User role permissions in the database
