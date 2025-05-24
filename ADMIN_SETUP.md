# Admin Account Setup

This document explains how to set up the admin account for Dizit Solutions.

## Default Admin Account

The default admin account has the following credentials:

- **Email**: admin@gmail.com
- **Password**: Admin@123

## Creating the Admin Account

If the default admin account doesn't exist in the database, you need to create it using the provided script.

### Prerequisites

1. Make sure you have a `.env.local` file in the root directory with the following variables:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB=Dizitsolution

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-at-least-32-characters
```

2. Ensure you have installed all dependencies:

```bash
npm install
```

### Running the Admin Creation Script

Run the following command to create the admin account:

```bash
npm run create-admin
```

This script will:
1. Connect to your MongoDB database
2. Check if an admin account with the email "admin@gmail.com" already exists
3. If it doesn't exist, create a new admin account with the default credentials
4. Output the result of the operation

### Troubleshooting

If you encounter any issues:

1. **Database Connection Error**:
   - Check that your MongoDB connection string in `.env.local` is correct
   - Ensure your MongoDB server is running and accessible

2. **Script Execution Error**:
   - Make sure you have installed all dependencies with `npm install`
   - Check that the `dotenv` package is installed

3. **Admin Account Already Exists**:
   - If the script says "Admin user already exists", you can use the existing account
   - If you've forgotten the password, you can create a new admin account through the admin signup page

## Logging In

After creating the admin account, you can log in at `/admin/login` with the default credentials.

## Creating Additional Admin Accounts

You can create additional admin accounts through the admin signup page at `/admin/signup`. You'll need the admin secret key, which is:

- **Default Admin Secret Key**: dizit-admin-secret-2024

This key can be changed by setting the `ADMIN_AUTH_SECRET` or `ADMIN_SECRET_KEY` environment variable in your `.env.local` file.
