# Auth0 Setup Guide

## What You Need to Do in Auth0 Dashboard

### 1. Create Auth0 Account
- Go to [auth0.com](https://auth0.com)
- Sign up for free account
- Create new tenant (e.g., `rentroll-ai`)

### 2. Create Applications

#### Frontend Application (React Native App)
- Type: Native Application
- Name: `RentRoll AI Frontend`
- Technology: React
- **Save these values:**
  - Domain: `your-tenant.auth0.com`
  - Client ID: `[generated]`

#### Backend Application (API)
- Type: Machine to Machine
- Name: `RentRoll AI Backend API`
- **Save these values:**
  - Client ID: `[generated]`
  - Client Secret: `[generated]`

### 3. Create API
- Name: `RentRoll AI API`
- Identifier: `https://api.rentroll-ai.com`
- Signing Algorithm: RS256

### 4. Configure User Roles
Create these roles in Auth0:
- `super_admin` - You (access all clients)
- `client_admin` - Client administrators  
- `client_user` - Regular client users

### 5. Custom Claims
Add custom claims to tokens:
```javascript
// Auth0 Rule to add custom claims
function addCustomClaims(user, context, callback) {
  const namespace = 'https://rentroll-ai.com/';
  
  context.idToken[namespace + 'roles'] = user.app_metadata?.roles || [];
  context.idToken[namespace + 'client_id'] = user.app_metadata?.client_id;
  context.accessToken[namespace + 'roles'] = user.app_metadata?.roles || [];
  context.accessToken[namespace + 'client_id'] = user.app_metadata?.client_id;
  
  callback(null, user, context);
}
```

## Environment Variables Needed

### Backend (.env)
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_API_AUDIENCE=https://api.rentroll-ai.com
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_ALGORITHMS=RS256
```

### Frontend (.env)
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-frontend-client-id
VITE_AUTH0_AUDIENCE=https://api.rentroll-ai.com
VITE_AUTH0_REDIRECT_URI=http://localhost:3000
```

## Next Steps After Auth0 Setup

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend && poetry add python-jose[cryptography] python-multipart

   # Frontend  
   cd frontend && npm install @auth0/auth0-react
   ```

2. **Implement Authentication**
   - Backend: JWT middleware
   - Frontend: Auth0 React wrapper
   - Protected routes
   - User context

3. **Test Authentication**
   - Login/logout flow
   - Token validation
   - Role-based access

Once you have the Auth0 values, I'll help implement the authentication system!
