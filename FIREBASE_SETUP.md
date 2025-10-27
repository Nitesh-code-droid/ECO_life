# Firebase Setup Guide for EcoLife

This guide will help you set up Firebase authentication for the EcoLife app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `ecolife-app` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started" if it's your first time
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable" to turn it on
6. Add your email as an authorized domain if needed
7. Click "Save"

## Step 3: Enable Firestore Database

1. Click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can change this later)
4. Select a location for your database
5. Click "Done"

## Step 4: Get Your Firebase Configuration

1. Click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon `</>` to add a web app
5. Enter app nickname: `ecolife-web`
6. Check "Also set up Firebase Hosting" (optional)
7. Click "Register app"
8. Copy the `firebaseConfig` object that appears

## Step 5: Configure Your App

1. In your project root, create a `.env` file (copy from `.env.example`)
2. Replace the placeholder values with your actual Firebase config (Vite uses `VITE_`):

```env
VITE_FIREBASE_API_KEY=AIzaSyC...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Step 6: Set Up Firestore Security Rules

1. Go back to Firestore Database in Firebase Console
2. Click on "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own habits
    match /habits/{habitId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. Click "Publish"

## Step 7: Test Your Setup

1. Restart your development server: `pnpm run dev`
2. Open the app in your browser
3. Click "Continue with Google" on the login page
4. You should be redirected to Google's OAuth flow
5. After successful login, you should see the EcoLife dashboard

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Add your domain (e.g., `localhost` for development)

2. **"Firebase: Error (auth/popup-blocked)"**
   - Make sure popup blockers are disabled for your site
   - Try using a different browser

3. **Environment variables not loading**
   - Make sure your `.env` file is in the project root
   - Restart your development server after creating `.env`
   - Environment variables must start with `VITE_` (Vite requirement)

4. **Firestore permission errors**
   - Check that your security rules are properly configured
   - Make sure the user is authenticated before making database calls

### Development vs Production

- **Development**: Use `localhost` in authorized domains
- **Production**: Add your actual domain to authorized domains in Firebase Console

## Security Best Practices

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Set up proper Firestore security rules** before going to production
4. **Enable App Check** for additional security (optional)

## Next Steps

Once Firebase is working:
1. Test all authentication flows (login, logout)
2. Verify that user data is being saved to Firestore
3. Test habit logging and data persistence
4. Deploy to production with proper environment variables

Need help? Check the [Firebase Documentation](https://firebase.google.com/docs) or create an issue in the project repository.