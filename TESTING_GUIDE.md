# AfriBiz Authentication System - Testing Guide

Complete guide to test all authentication flows and verify the system is working correctly.

## Prerequisites

1. ✅ Backend running on `http://localhost:3001`
2. ✅ Frontend running on `http://localhost:3000`
3. ✅ PostgreSQL database running
4. ✅ Environment variables configured
5. ✅ Email service configured (Mailtrap or similar)

## 1️⃣ Manual Testing with Browser

### 1.1 Test User Registration (Signup)

**Test Case: Valid Signup**
1. Navigate to `http://localhost:3000/signup`
2. Fill in form with:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Phone: `+234 (optional)`
   - Password: `SecurePass123!` (must contain uppercase, lowercase, number, special char)
   - Confirm Password: `SecurePass123!`
   - Terms: Check the checkbox
3. Click "Sign Up"
4. **Expected Result**: 
   - ✅ Redirected to `/verify-email` page
   - ✅ Message: "Check your email to verify your account"
   - ✅ User logged in (access token in localStorage)
   - ✅ Email received in Mailtrap inbox with verification link

**Test Case: Invalid Passwords**
- Password: `weak` → Should show error "Password must be at least 8 characters"
- Password: `nouppercase123!` → Should show error "Password must contain uppercase letter"
- Password: `NOLOWERCASE123!` → Should show error "Password must contain lowercase letter"
- Password: `NoNumbers!` → Should show error "Password must contain number"
- Password: `NoSpecialChar123` → Should show error "Password must contain special character"

**Test Case: Email Already Exists**
1. Try signing up with same email twice
2. **Expected Result**: Error message "Email already registered"

**Test Case: Passwords Don't Match**
1. Enter different passwords in password fields
2. **Expected Result**: Error message "Passwords don't match"

### 1.2 Test Email Verification

**Test Case: Auto-Verify from Email Link**
1. Complete signup
2. Check Mailtrap inbox
3. Click verification link in email
4. **Expected Result**:
   - ✅ Redirected to `/verify-email` page showing success
   - ✅ Message: "Your email has been verified!"
   - ✅ Can see "Sign In with Email" button

**Test Case: Manual Email Entry for Resend**
1. On verify-email page, if auto-verify fails:
2. Enter email in manual input field
3. Click "Resend verification email"
4. **Expected Result**:
   - ✅ New email sent to Mailtrap
   - ✅ Message: "Verification email sent to john@example.com"

**Test Case: Invalid/Expired Token**
1. Try accessing `/verify-email?token=invalid-token`
2. **Expected Result**: Error shown, can enter email for resend

### 1.3 Test User Login

**Test Case: Valid Login**
1. Navigate to `http://localhost:3000/login`
2. Enter email and password
3. Uncheck "Remember Me" (testing without persistent cookie)
4. Click "Sign In"
5. **Expected Result**:
   - ✅ Redirected to `/dashboard`
   - ✅ User info displayed
   - ✅ User name shown as "John Doe"
   - ✅ Current role shows as "Client"

**Test Case: Invalid Email**
1. Enter: `nonexistent@example.com`
2. Enter any password
3. Click "Sign In"
4. **Expected Result**: Error message "Invalid credentials"

**Test Case: Invalid Password**
1. Enter: correct email
2. Enter: `WrongPassword123!`
3. Click "Sign In"
4. **Expected Result**: Error message after 1st attempt, count increases

**Test Case: Account Lockout (Brute Force Protection)**
1. Enter correct email with wrong password 5 times
2. **Expected Result**: Error message "Account temporarily locked. Try again after 15 minutes"
3. Check database: `User.isLocked` = true, `User.lockUntil` = future timestamp
4. Wait 15 minutes or manually unlock in database
5. Login should work again

**Test Case: Remember Me**
1. Login and check "Remember Me"
2. Close browser
3. Reopen `http://localhost:3000`
4. **Expected Result**: 
   - ✅ Still logged in
   - ✅ Dashboard displayed without re-login

### 1.4 Test Password Recovery

**Test Case: Forgot Password Flow**
1. Navigate to `http://localhost:3000/login`
2. Click "Forgot your password?"
3. Enter registered email
4. Click "Send Reset Link"
5. **Expected Result**:
   - ✅ Redirected to confirmation screen
   - ✅ Message: "Password reset link sent to john@example.com"
   - ✅ Email received in Mailtrap with reset link
   - ✅ Reset link expires in 1 hour (shown in email)

**Test Case: Reset Password with Valid Token**
1. Click reset link from email
2. Redirected to `/reset-password?token=...`
3. Enter new password: `NewSecure456!`
4. Confirm password: `NewSecure456!`
5. Click "Reset Password"
6. **Expected Result**:
   - ✅ Success screen shown
   - ✅ Message: "Your password has been reset"
   - ✅ Button: "Sign In with New Password"
   - ✅ Redirected to login with new password working

**Test Case: Invalid/Expired Token**
1. Try accessing `/reset-password?token=invalid-token`
2. **Expected Result**: Error message "Invalid or expired reset link"

**Test Case: Passwords Don't Match**
1. Enter different passwords
2. **Expected Result**: Error message "Passwords don't match"

### 1.5 Test Dashboard & Role Activation

**Test Case: Dashboard Access**
1. Login successfully
2. Redirect to `/dashboard`
3. **Expected Result**:
   - ✅ User info card shows: name, email, current role (Client)
   - ✅ Email status shown
   - ✅ Two role activation cards displayed (Business, Developer)

**Test Case: Activate Business Role**
1. On dashboard, click "Activate" on Business card
2. **Expected Result**:
   - ✅ Button changes to "Active" (disabled)
   - ✅ Badge appears showing "Active"
   - ✅ User now has BUSINESS role in database
   - ✅ Store updated with new role

**Test Case: Activate Developer Role**
1. On dashboard, click "Activate" on Developer card
2. **Expected Result**:
   - ✅ Button changes to "Active" (disabled)
   - ✅ Badge appears showing "Active"
   - ✅ User now has DEVELOPER role in database
   - ✅ User has multiple roles: [CLIENT, BUSINESS, DEVELOPER]

**Test Case: Logout**
1. On dashboard, click "Logout" button
2. **Expected Result**:
   - ✅ Redirected to `/login`
   - ✅ localStorage cleared
   - ✅ Session revoked in database
   - ✅ Refresh token cookie deleted

### 1.6 Test Session Management

**Test Case: Multi-Device Login**
1. Login on Browser 1
2. Open new incognito window (Browser 2)
3. Login with same email
4. Go back to Browser 1, visit `/dashboard`
5. Click "View Sessions" (if implemented)
6. **Expected Result**:
   - ✅ Two sessions shown
   - ✅ Different IPs/user agents
   - ✅ Can revoke individual sessions

**Test Case: Session Expiration**
1. Login and get access token (15 min expiry)
2. Wait 15 minutes (or manually set expiry to past time in tests)
3. Make a request (try refreshing dashboard)
4. **Expected Result**:
   - ✅ 401 error triggered
   - ✅ Frontend automatically attempts token refresh
   - ✅ New token pair issued
   - ✅ Request retried and succeeds

## 2️⃣ API Testing with Postman/cURL

### Setup Postman Collection

**Environment Variables:**
```json
{
  "api_url": "http://localhost:3001/api",
  "access_token": "",
  "refresh_token": "",
  "email": "test@example.com"
}
```

### 2.1 Test Signup Endpoint

```bash
POST http://localhost:3001/api/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+234",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "primaryRole": "CLIENT",
      "roles": ["CLIENT"],
      "emailVerified": false
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  },
  "message": "Registration successful"
}
```

### 2.2 Test Login Endpoint

```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  },
  "message": "Login successful"
}

Headers:
Set-Cookie: refreshToken=jwt-token; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

### 2.3 Test Token Refresh

```bash
POST http://localhost:3001/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "previous-refresh-token"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-jwt-token"
  },
  "message": "Token refreshed successfully"
}

Note: Old refresh token should be revoked
```

### 2.4 Test Protected Route

```bash
GET http://localhost:3001/api/auth/sessions
Authorization: Bearer {access_token}

Response (200):
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1",
        "createdAt": "2025-02-01T10:00:00Z",
        "expiresAt": "2025-02-08T10:00:00Z"
      }
    ]
  }
}
```

### 2.5 Test Send OTP

```bash
POST http://localhost:3001/api/auth/send-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"
}

Response (200):
{
  "success": true,
  "message": "OTP sent to email"
}
```

### 2.6 Test Verify OTP

```bash
POST http://localhost:3001/api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456",
  "type": "EMAIL_VERIFICATION"
}

Response (200):
{
  "success": true,
  "message": "OTP verified successfully"
}
```

## 3️⃣ Database Testing

### Query User Sessions

```sql
SELECT id, "userId", "userAgent", "ipAddress", "createdAt", "expiresAt" 
FROM "Session" 
WHERE "userId" = 'user-id'
ORDER BY "createdAt" DESC;
```

### Check Failed Login Attempts

```sql
SELECT id, "userId", "failedAttempts", "isLocked", "lockUntil" 
FROM "User" 
WHERE email = 'john@example.com';
```

### View Security Logs

```sql
SELECT id, "userId", action, "ipAddress", "userAgent", "createdAt" 
FROM "SecurityLog" 
WHERE "userId" = 'user-id'
ORDER BY "createdAt" DESC;
```

### Check Revoked Refresh Tokens

```sql
SELECT id, "userId", "isRevoked", "revokedAt" 
FROM "RefreshToken" 
WHERE "userId" = 'user-id';
```

## 4️⃣ Security Testing

### 4.1 Rate Limiting Test

```bash
# Make 6 signup requests in 15 minutes
# 6th request should be rejected with:
429 Too Many Requests
{
  "success": false,
  "message": "Too many signup attempts, please try again later"
}
```

### 4.2 CORS Testing

```bash
# From origin not in ALLOWED_ORIGINS
# Request should be rejected with:
Access-Control-Allow-Origin header missing
```

### 4.3 Password Validation Testing

```javascript
// Valid passwords
SecurePass123!     // ✅ All requirements met
P@ssw0rd           // ✅ Valid
AfriBiz2025!       // ✅ Valid

// Invalid passwords
password123!       // ❌ No uppercase
PASSWORD123!       // ❌ No lowercase
Passpass!          // ❌ No number
Password123        // ❌ No special char
Short1!            // ❌ Less than 8 chars
```

### 4.4 CSRF Protection (If Implemented)

```bash
# Requests should include CSRF token
# If not provided: 403 Forbidden
```

## 5️⃣ Error Handling Testing

### Expected Error Responses

**Invalid Email**
```json
{
  "success": false,
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR"
}
```

**User Not Found**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized - invalid token",
  "code": "UNAUTHORIZED"
}
```

**Forbidden**
```json
{
  "success": false,
  "error": "Forbidden - insufficient permissions",
  "code": "FORBIDDEN"
}
```

## 6️⃣ Performance Testing

### Measure API Response Times

```bash
# Signup - should be < 1000ms
time curl -X POST http://localhost:3001/api/auth/signup -d '{...}'

# Login - should be < 500ms
time curl -X POST http://localhost:3001/api/auth/login -d '{...}'

# Token Refresh - should be < 100ms
time curl -X POST http://localhost:3001/api/auth/refresh -d '{...}'
```

### Load Testing with Apache Bench

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3001/api/auth/login

# Check rate limiting kicks in appropriately
```

## 7️⃣ Email Template Testing

### Check Email Content

1. Navigate to Mailtrap inbox
2. For each email type, verify:
   - ✅ Proper branding (AfriBiz logo)
   - ✅ Emerald green color scheme
   - ✅ Clear call-to-action button
   - ✅ Links are clickable and functional
   - ✅ Mobile responsive
   - ✅ Sender name shows as "AfriBiz"

### Email Types to Test

1. **Welcome/Signup Confirmation** - Sent immediately on signup
2. **Email Verification** - Contains verification link
3. **Password Reset** - Contains 1-hour expiry notice
4. **Login OTP** - Contains 6-digit code
5. **Suspicious Login Alert** - Shows IP and device info

## 🎯 Test Checklist

### Pre-Testing
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] PostgreSQL running
- [ ] Environment variables configured
- [ ] Mailtrap account created

### User Signup & Email
- [ ] Valid signup with all fields
- [ ] Password validation (all edge cases)
- [ ] Email already exists error
- [ ] Email verification with link click
- [ ] Manual resend verification
- [ ] Invalid token handling

### User Login
- [ ] Valid login credentials
- [ ] Invalid email error
- [ ] Invalid password error
- [ ] Account lockout after 5 failures
- [ ] Remember me functionality
- [ ] Session created in database

### Password Recovery
- [ ] Forgot password email sent
- [ ] Reset link works
- [ ] Token expiration (1 hour)
- [ ] Password validation on reset
- [ ] Login with new password

### Dashboard & Roles
- [ ] Dashboard displays after login
- [ ] Business role activation works
- [ ] Developer role activation works
- [ ] Multiple roles supported
- [ ] Logout works properly

### API Endpoints
- [ ] GET /sessions - returns user sessions
- [ ] POST /activate-business - adds role
- [ ] POST /activate-developer - adds role
- [ ] POST /refresh - new token pair
- [ ] POST /logout - revokes tokens

### Security
- [ ] Rate limiting enforced
- [ ] Refresh tokens stored as HTTP-only
- [ ] CORS headers correct
- [ ] Passwords hashed with bcrypt
- [ ] Security logs recorded
- [ ] Token rotation works

### Database
- [ ] User created with CLIENT role
- [ ] Session created on login
- [ ] Refresh tokens tracked
- [ ] Failed attempts incremented
- [ ] Account lockout persisted
- [ ] Roles properly assigned

## 📊 Test Results Template

```markdown
### Test Run: [Date]
- Tester: [Name]
- Environment: Development
- Build: [Commit Hash]

#### Results
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

#### Issues Found
1. [Issue Title] - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

#### Sign-off
Tester: _________________ Date: _____________
```

## 🚀 Continuous Testing

### Weekly
- [ ] Full manual regression test
- [ ] Load testing (100 concurrent users)
- [ ] Security audit of logs

### Before Release
- [ ] 100% test coverage
- [ ] E2E testing of all flows
- [ ] Performance benchmarking
- [ ] Security penetration testing
- [ ] Accessibility audit (WCAG 2.1)

---

**Last Updated**: [Current Date]
**Next Review**: [One Month from Now]
