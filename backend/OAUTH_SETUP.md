# Google OAuth Configuration

## Environment Variables

Add these to your `.env` file or environment:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-app-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://127.0.0.1:8080/api/v1/auth/oauth/google/callback
```

## Setup Instructions

1. **Create Google OAuth App**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs: Add your callback URL

2. **Set Environment Variables**:
   ```powershell
   $env:GOOGLE_CLIENT_ID="your-client-id"
   $env:GOOGLE_CLIENT_SECRET="your-client-secret"
   $env:GOOGLE_REDIRECT_URL="http://127.0.0.1:8080/api/v1/auth/oauth/google/callback"
   ```

3. **Run Migration**:
   ```powershell
   cd migration
   cargo run
   ```

## Testing the Flow

1. **Start server**:
   ```powershell
   cargo run
   ```

2. **Initiate OAuth**:
   Open in browser: `http://127.0.0.1:8080/api/v1/auth/oauth/google`

3. **Expected Flow**:
   - Redirects to Google consent page
   - User logs in and grants permissions
   - Google redirects back to `/callback` with code
   - Server exchanges code for tokens
   - Server creates/finds user
   - Returns JWT tokens

## Endpoints

- **GET /api/v1/auth/oauth/google** - Initiate OAuth (redirects to Google)
- **GET /api/v1/auth/oauth/google/callback** - OAuth callback (returns JWT)

## Security Notes

- State tokens expire in 10 minutes
- State is single-use (deleted after validation)
- Google users created with status=Active (email pre-verified)
- Inactive users are blocked by auth middleware
