# 🔴 Bombay Pizza Club — Full Security Audit Report

**Date:** June 24, 2026  
**Auditor:** Senior Security Engineer  
**Scope:** Full-stack food delivery application (Express.js + React + MongoDB + Socket.IO + Razorpay)

---

## Executive Summary

This audit identified **23 security vulnerabilities** ranging from **Critical** to **Low** severity. The application has several well-intentioned security fixes but contains fundamental flaws that could allow an attacker to bypass payment, escalate privileges, access other users' data, and extract sensitive credentials. The most critical issue is that **private Firebase admin keys, Razorpay secrets, and database credentials are committed to the repository** and available in the `.env` and `serviceAccountKey.json` files.

---

## 🔴 VULNERABILITY 1: Firebase Service Account Private Key Committed to Git

**Severity:** Critical  
**Affected Files:**
- `backend/serviceAccountKey.json` (full file, lines 1-13)

**Description:**  
The Firebase Admin SDK private key (`serviceAccountKey.json`) is present in the repository. While `.gitignore` lists this file, it has already been committed and pushed. Compromised private keys allow full administrative access to Firebase project, including reading/writing Firestore, sending push notifications as the app, and potentially accessing Firebase Authentication.

**Attack Scenario:**
1. Attacker clones the repository or reads the committed file from GitHub history.
2. Uses the service account credentials to authenticate to Firebase Admin SDK.
3. Gains full administrative access to the Firebase project (bombaypizza-154bf).

**Impact:**
- Full Firebase project compromise
- Ability to send arbitrary push notifications to all users
- Access to Firestore database if configured
- Ability to impersonate Firebase services

**Evidence:**
```json
backend/serviceAccountKey.json:
{
  "type": "service_account",
  "project_id": "bombaypizza-154bf",
  "private_key_id": "22d730f76c2de49386990efc8e0ec98cd70ad60a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDkuAIirThRt8CN\n..."
}
```

**Recommendation:**  
Immediately rotate the Firebase service account key in GCP console. Remove the file from Git history using `git filter-branch` or `BFG Repo-Cleaner`. Use environment variables exclusively for production deployment.

---

## 🔴 VULNERABILITY 2: All API Credentials and Secrets Exposed in `.env` Files

**Severity:** Critical  
**Affected Files:**
- `backend/.env` (lines 1-15)
- `frontend/.env` (lines 1-7)

**Description:**  
Both `.env` files are committed to the repository and contain live production credentials:
- **MongoDB connection string** with username/password (`dbbombay1234`)
- **Razorpay test key_id and key_secret** (can still be used to process payments in test mode)
- **Cloudinary API key and secret** (full media management access)
- **Gmail email/password** for sending OTPs
- **Mapbox API token** with geocoding access
- **Firebase VAPID key**
- **Firebase API key**

**Attack Scenario:**
1. Attacker extracts credentials from the committed `.env` files.
2. Uses MongoDB credentials to directly connect to the production database.
3. Uses Gmail credentials to send phishing emails from the official domain.
4. Uses Cloudinary credentials to access/modify all media assets.
5. Uses Razorpay credentials to process fraudulent payments or view payment history.
6. Uses mapbox token at `https://api.mapbox.com` to consume geocoding services.

**Impact:**
- Complete database compromise (read/write/delete all orders, users, items)
- Email account compromise (send malicious emails as bombaypizza06@gmail.com)
- Media/CDN compromise
- Payment processing abuse
- Unlimited API consumption

**Evidence:**
```env
backend/.env (line 2): MONGODB_URL=mongodb+srv://bombaypizza06_db_user:dbbombay1234@cluster0.svat82m.mongodb.net/BombayPizzaClub
backend/.env (line 5): PASS= testpass123
backend/.env (line 9): RAZORPAY_KEY_ID= rzp_test_T2a1hwZQktgDMA
backend/.env (line 10): RAZORPAY_KEY_SECRET= NgrWHkOMHvuBAyF0izVeaMP0
```

**Recommendation:**  
Immediately rotate ALL credentials. Remove `.env` files from Git history. Add `.env` to `.gitignore`. Use a secrets manager for production.

---

## 🔴 VULNERABILITY 3: Weak JWT Secret

**Severity:** Critical  
**Affected Files:**
- `backend/.env` (line 3)
- `backend/utils/token.js` (line 5)
- `backend/middlewares/isAuth.js` (line 8)

**Description:**  
The JWT signing secret `KJHGSDIOKJOHDF` is weak, predictable, and exposed in the repository. An attacker can forge valid JWT tokens to impersonate any user, including owners and delivery boys.

**Attack Scenario:**
1. Attacker extracts JWT_SECRET from repository.
2. Forges a JWT with `{userId: "<any_mongo_id>"}`.
3. Sets cookie `token=<forged_jwt>` in browser or API requests.
4. Gains full access as any user, including owners and admin roles.
5. Can access all orders, modify items, accept deliveries, etc.

**Impact:**
- Complete account takeover of any user
- Privilege escalation to owner/deliveryBoy
- Full API access without authentication bypass

**Evidence:**
```js
backend/.env (line 3): JWT_SECRET="KJHGSDIOKJOHDF"
backend/utils/token.js:
    const token= jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"7d"})
backend/middlewares/isAuth.js:
    const decodeToken=jwt.verify(token,process.env.JWT_SECRET)
```

**Recommendation:**  
Use a cryptographically random 256-bit secret. Use `openssl rand -hex 32` to generate. Never commit to version control.

---

## 🔴 VULNERABILITY 4: Full User Object (with Password Hash) Returned in API Responses

**Severity:** Critical  
**Affected Files:**
- `backend/controllers/auth.controllers.js` (lines 41, 72, 155-163)
- `backend/controllers/user.controllers.js` (lines 10-12, mentioned as "FIX H1" but `getCurrentUser` properly excludes fields)

**Description:**  
The `signUp`, `signIn`, and `googleAuth` endpoints return the full Mongoose user document directly to the client. While the password is hashed (bcrypt), the hash itself is still exposed. This enables offline brute-force attacks. Additionally, fields like `resetOtp`, `otpExpires`, `isOtpVerified`, `socketId`, `fcmToken`, and `location` are exposed.

**Attack Scenario:**
1. Attacker signs up or signs in to get a user object with `password` field.
2. Extracts the bcrypt hash.
3. Performs offline dictionary/brute-force attack on the hash.
4. If cracked, has the actual password which may be reused on other services.

**Impact:**
- Plain-text password recovery through offline cracking
- Exposure of internal state fields (OTP verification status, socket IDs, FCM tokens)
- User tracking through socketId/fcmToken

**Evidence:**
```js
backend/controllers/auth.controllers.js (line 41):
    return res.status(201).json(user)  // Returns entire user document including password hash

backend/controllers/auth.controllers.js (line 72):
    return res.status(200).json(user)  // Same issue

backend/controllers/auth.controllers.js (line 163):
    return res.status(200).json(user)  // Same issue

Note: getCurrentUser (user.controllers.js line 10-12) properly uses .select("-password -resetOtp -otpExpires -isOtpVerified -fcmToken -socketId")
```

**Recommendation:**  
Create a user response DTO/serializer that explicitly whitelists fields returned to the client. Never return the Mongoose document directly.

---

## 🟠 VULNERABILITY 5: `search-items` Endpoint Has No Authentication

**Severity:** High  
**Affected Files:**
- `backend/routes/item.routes.js` (lines 61-70)

**Description:**  
The `/api/item/search-items` endpoint does NOT have the `isAuth` middleware, unlike all other item endpoints. Any unauthenticated user can search menu items. While the impact is low for item names, this is inconsistent with the security model and could be used for reconnaissance.

**Attack Scenario:**
1. Unauthenticated attacker sends requests to `/api/item/search-items?query=pizza`.
2. Gets back full item data including `owner._id`, prices, and categories.
3. Uses this information to enumerate valid MongoDB ObjectIds.

**Impact:**
- Information disclosure (menu items, owner IDs)
- Reconnaissance for further attacks
- Bypass of authentication requirement

**Evidence:**
```js
backend/routes/item.routes.js (lines 61-70):
itemRouter.get("/search-items",
    [  // NOTE: No isAuth middleware here!
        query("query")
            .trim()
            .notEmpty().withMessage("Search query is required")
            .isLength({ max: 100 }).withMessage("Query too long")
    ],
    validate,
    searchItems
)
```

**Recommendation:**  
Add `isAuth` middleware to the `search-items` route, consistent with all other item routes.

---

## 🟠 VULNERABILITY 6: No Ownership Validation on Order Placement — `cartItem.owner` is Client-Supplied

**Severity:** High  
**Affected Files:**
- `backend/controllers/order.controllers.js` (lines 86-145)

**Description:**  
During order placement, the `owner` field for each cart item is taken directly from the frontend request without verifying that the item actually belongs to that owner. An attacker could manipulate the `owner` field to:
1. Cause orders to be misattributed to wrong restaurant owners.
2. Potentially trigger notification/delivery routing to wrong owners.

**Attack Scenario:**
1. Malicious user intercepts the place-order API request.
2. Changes `cartItems[0].owner` to a different owner's MongoDB ID.
3. The order gets routed to the wrong owner (but item price is still fetched from DB).
4. The wrong owner receives the order notification and is expected to fulfill it.

**Impact:**
- Order misrouting to wrong restaurant owners
- Business logic disruption
- Potential denial of service to legitimate owners

**Evidence:**
```js
backend/controllers/order.controllers.js (line 122-144):
for (const cartItem of cartItems) {
    const ownerId = cartItem.owner  // <-- DIRECTLY FROM FRONTEND, NO VERIFICATION
    if (!ownerId || ownerId === "undefined" || ownerId === "null") continue
    // ...
    const dbItem = await Item.findById(cartItem.id || cartItem._id)
    if (!dbItem) {
        return res.status(400).json({ message: `Item not found: ${cartItem.name}` })
    }
    // NOTE: No check that dbItem.owner === cartItem.owner
    groupItemsByOwner[ownerId].push({...})
}
```

**Recommendation:**  
Verify that `dbItem.owner.toString() === cartItem.owner` for each cart item. Reject mismatches.

---

## 🟠 VULNERABILITY 7: No Input Validation on `deliveryAddress.latitude/longitude` and `updateUserLocation`

**Severity:** High  
**Affected Files:**
- `backend/controllers/order.controllers.js` (lines 86-117)
- `backend/controllers/user.controllers.js` (lines 22-37)

**Description:**  
While the route-level validation checks that latitude/longitude are present and are floats, there is no business-level validation:
- Latitude must be -90 to 90
- Longitude must be -180 to 180
- Location updates via user controller have NO validation at all

**Attack Scenario:**
1. Attacker sends a request with `latitude: 9999, longitude: 9999`.
2. The haversine calculation produces NaN or incorrect results.
3. Delivery range check is bypassed (invalid coordinates produce NaN, NaN > 5 is false).
4. The order is placed from an "in-range" location.

**Evidence:**
```js
backend/controllers/order.controllers.js (lines 106-117):
const userLat = parseFloat(deliveryAddress.latitude)
const userLng = parseFloat(deliveryAddress.longitude)
const distanceKm = haversineDistance(shopLat, shopLng, userLat, userLng)
if (distanceKm > deliveryRadiusKm) {  // NaN > 5 evaluates to false — BYPASS!
    return res.status(400).json({ message: "..." })
}

backend/controllers/user.controllers.js (lines 22-37):
export const updateUserLocation = async (req, res) => {
    const { lat, lon } = req.body
    // NO VALIDATION AT ALL — any values accepted
    const user = await User.findByIdAndUpdate(req.userId, {
        location: { type: 'Point', coordinates: [lon, lat] }
    }, { new: true })
```

**Recommendation:**  
Validate latitude (-90 to 90) and longitude (-180 to 180) ranges. Add validation middleware for the user location update endpoint. Check for NaN after parseFloat before computing distance.

---

## 🟠 VULNERABILITY 8: Race Condition in `acceptOrder` — Double Assignment Possible

**Severity:** High  
**Affected Files:**
- `backend/controllers/order.controllers.js` (lines 484-523)

**Description:**  
The `acceptOrder` endpoint checks if an assignment is still "brodcasted" and then sets it to "assigned". However, there is no atomic operation or transaction. Multiple delivery boys could call this endpoint simultaneously, and both could receive "order accepted" confirmation, resulting in multiple delivery boys being assigned to the same order.

**Attack Scenario:**
1. Owner broadcasts delivery assignment to multiple delivery boys.
2. Two delivery boys simultaneously click "Accept" at the exact same time.
3. Both pass the `status !== "brodcasted"` check before either writes.
4. Both receive success response. Order ends up with two delivery boys.

**Impact:**
- Double assignment of delivery orders
- Confusion and conflict in delivery logistics
- Potential fraud (both claim delivery completed)

**Evidence:**
```js
backend/controllers/order.controllers.js (lines 484-519):
export const acceptOrder = async (req, res) => {
    const assignment = await DeliveryAssignment.findById(assignmentId)
    if (assignment.status !== "brodcasted") {  // RACE CONDITION WINDOW
        return res.status(400).json({ message: "assignment is expired" })
    }
    // ... more checks ...
    assignment.assignedTo = req.userId
    assignment.status = 'assigned'
    await assignment.save()  // Both requests can reach here simultaneously
```

**Recommendation:**  
Use `findOneAndUpdate` with a status condition atomically:
```js
const assignment = await DeliveryAssignment.findOneAndUpdate(
    { _id: assignmentId, status: "brodcasted" },
    { $set: { status: "assigned", assignedTo: req.userId, acceptedAt: new Date() } },
    { new: true }
)
```

---

## 🟠 VULNERABILITY 9: Cookie `secure: false` in Production

**Severity:** High  
**Affected Files:**
- `backend/controllers/auth.controllers.js` (lines 34-38, 64-69, 156-160)

**Description:**  
The authentication cookie is set with `secure: false`, meaning it will be transmitted over unencrypted HTTP connections. In production, if HTTPS is not enforced or if there's a man-in-the-middle, the JWT token can be intercepted.

**Attack Scenario:**
1. User connects to the application over HTTP (or attacker performs SSL stripping).
2. Authentication cookie is sent in plaintext with every request.
3. Attacker on the same network (Wi-Fi, ISP, etc.) captures the cookie.
4. Uses the stolen cookie to impersonate the user (session hijacking).

**Evidence:**
```js
// Repeated in signUp, signIn, googleAuth:
res.cookie("token", token, {
    secure: false,       // <--- TRANSMITTED OVER HTTP
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
})
```

**Recommendation:**  
Set `secure: true` in production. Use environment variable to toggle:
```js
secure: process.env.NODE_ENV === "production"
```

---

## 🟠 VULNERABILITY 10: Place Order Accepts `cartItems` Without Verifying User Ownership

**Severity:** High  
**Affected Files:**
- `frontend/src/pages/CheckOut.jsx` (lines 300-309)
- `backend/controllers/order.controllers.js` (lines 86-145)

**Description:**  
The frontend sends Redux `cartItems` directly to the backend. An attacker can modify the payload to include ANY items in the cart, including items they don't own or items from other restaurants, by manipulating the request body. While prices are recalculated from DB, the `id`/`_id` field in each cartItem is user-controlled, and there's no check that the user adding the item is actually authorized to order from that owner's shop.

**Attack Scenario:**
1. Attacker modifies the POST request body for `/api/order/place-order`.
2. Adds items with arbitrary `id` values (valid MongoDB ObjectIds of existing items).
3. The backend fetches these items from DB and creates the order.
4. No verification that the user should be able to order from that owner or that the items form a coherent order.

**Impact:**
- Ability to order items from any owner
- Potential to disrupt order management by referencing deleted items
- Possible enumeration of valid item ObjectIds (reveals which items exist in DB)

**Evidence:**
```js
// Frontend sends Redux state directly (CheckOut.jsx line 307-309):
cartItems  // This is the full Redux cartItems array — user can modify via DevTools

// Backend blindly processes (order.controllers.js lines 132-134):
const dbItem = await Item.findById(cartItem.id || cartItem._id)
if (!dbItem) {
    return res.status(400).json({ message: `Item not found: ${cartItem.name}` })
}
// NOTE: No check if item exists, is active, or if user is authorized to order it
```

**Recommendation:**  
No need to add authorization per-item (all items are public), but validate that referenced items exist and belong to a real owner. Consider checking that all items are from the same market/available region.

---

## 🟠 VULNERABILITY 11: Express 5 with Incompatible Middleware Pattern

**Severity:** High  
**Affected Files:**
- `backend/package.json` (line 18)
- All route files

**Description:**  
The application uses `express@5.1.0` (Express 5) which is a pre-release version with significant breaking changes. Express 5 changes error handling, async middleware behavior, and routing semantics. Mixing Express 5 with Express 4-style middleware patterns can lead to unexpected behavior, including unhandled promise rejections and silent request failures.

**Attack Scenario:**
1. Developer adds an async route handler that throws an error.
2. Express 5 handles async errors differently, potentially crashing the process or leaving requests hanging.
3. Attacker triggers the error condition, causing denial of service.

**Impact:**
- Potential for unhandled async errors to crash the server
- Unexpected middleware behavior
- Inconsistent error handling across the application

**Evidence:**
```json
backend/package.json (line 18): "express": "^5.1.0",
```

**Recommendation:**  
Downgrade to Express 4.x stable (`express@^4.21.0`) which has extensive production testing and better async error handling support. Alternatively, fully upgrade to Express 5 semantics and audit all route handlers.

---

## 🟡 VULNERABILITY 12: Missing HTTP Security Headers

**Severity:** Medium  
**Affected Files:**
- `backend/index.js` (lines 1-87)

**Description:**  
The application does not use `helmet` or any equivalent middleware to set security-related HTTP headers:
- No Content-Security-Policy (CSP)
- No Strict-Transport-Security (HSTS)
- No X-Frame-Options (clickjacking protection)
- No X-Content-Type-Options (MIME sniffing protection)
- No Referrer-Policy

**Attack Scenario:**
1. Attacker hosts a malicious page in an iframe that loads the Bombay Pizza Club checkout page.
2. User clicks "Place Order" thinking it's part of the malicious page (clickjacking).
3. Order is placed fraudulently.

**Impact:**
- Clickjacking vulnerability
- MIME-sniffing attacks on uploaded content
- Missing HSTS enables SSL-stripping attacks
- Cross-site scripting amplification

**Evidence:**
```js
// backend/index.js — No helmet configuration anywhere
```

**Recommendation:**  
Install and configure `helmet` middleware. Set appropriate CSP, HSTS, X-Frame-Options, and other security headers.

---

## 🟡 VULNERABILITY 13: Weak Email Password and Plaintext SMTP Credentials

**Severity:** Medium  
**Affected Files:**
- `backend/.env` (line 5)
- `backend/utils/mail.js` (lines 4-12)

**Description:**  
The Gmail account password `testpass123` is weak and hardcoded in the repository. This email account (`bombaypizza06@gmail.com`) is used to send OTP and delivery notifications. Compromise of this account allows:
- Reading OTP codes sent to users
- Sending phishing emails from the official domain
- Potential account recovery attacks on other services

**Attack Scenario:**
1. Attacker extracts `EMAIL` and `PASS` from `.env`.
2. Logs into Gmail account `bombaypizza06@gmail.com`.
3. Reads all sent/failed OTP emails, enabling account takeover.
4. Sends malicious emails to all registered users phishing for credentials.

**Impact:**
- Account takeover of all users via OTP interception
- Reputational damage from phishing campaigns
- Access to connected Google services

**Evidence:**
```env
backend/.env (line 4-5):
EMAIL= bombaypizza06@gmail.com
PASS= testpass123
```

**Recommendation:**  
Use an App Password (generated through Google Account settings) or OAuth 2.0 for Gmail SMTP. Never use the main account password. Rotate immediately.

---

## 🟡 VULNERABILITY 14: SignUp Returns Password Hash to Client

**Severity:** Medium  
**Affected Files:**
- `backend/controllers/auth.controllers.js` (lines 25-41)

**Description:**  
After `User.create()`, the returned `user` object contains `password` (the bcrypt hash). This is sent back to the client in the response. An attacker who intercepts the response or views it in DevTools can extract the hash and attempt offline cracking.

**Attack Scenario:**
1. User signs up and the full user document is returned.
2. Attacker (or malicious browser extension) reads the network response.
3. Extracts the bcrypt password hash.
4. Runs hashcat or John the Ripper offline to recover the password.
5. Uses the password on other services (password reuse).

**Impact:**
- Offline brute-force of user passwords
- Credential stuffing on other platforms

**Evidence:**
```js
backend/controllers/auth.controllers.js (lines 25-41):
const hashedPassword = await bcrypt.hash(password, 10)
user = await User.create({
    fullName, email, role, mobile, password: hashedPassword
})
// ... token generation ...
return res.status(201).json(user)  // user.password = bcrypt hash IS RETURNED
```

Similarly in `signIn` (line 72) and `googleAuth` (line 163).

**Recommendation:**  
Use `.select("-password")` before returning, or explicitly construct a safe response object:
```js
const { password, resetOtp, otpExpires, ...safeUser } = user.toObject()
return res.status(201).json(safeUser)
```

---

## 🟡 VULNERABILITY 15: No MongoDB Injection Protection / Unsafe Query Patterns

**Severity:** Medium  
**Affected Files:**
- `backend/controllers/order.controllers.js` (lines 86-145)
- `backend/controllers/item.controllers.js` (line 104)
- `backend/controllers/auth.controllers.js`

**Description:**  
While Express-validator provides basic input validation, there is no protection against MongoDB query operator injection. If attacker-controlled values flow into MongoDB query operators like `$gt`, `$ne`, `$regex`, or `$where`, the query behavior can be manipulated.

**Attack Scenario:**
1. For `search-items`, the query is escaped for regex (line 101), but `category` and `foodType` fields are not validated against known enums in some endpoints.
2. If any route passes uncontrolled input directly to MongoDB, an attacker could inject `$gt`, `$ne` operators.
3. For example, if a future endpoint uses `req.body.field` in a MongoDB query without strict type checking, NoSQL injection is possible.

**Evidence:**
```js
// Partially mitigated — query is regex-escaped (item.controllers.js line 101):
const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// But the general pattern is unsafe (item.controllers.js line 104):
const items = await Item.find({
    $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { category: { $regex: escapedQuery, $options: "i" } }
    ]
})
```

**Recommendation:**  
Use strict type checking. For enum fields, validate against allowed values before passing to MongoDB. Consider using `mongoose-sanitizer` or similar to strip `$` prefixed keys from request bodies.

---

## 🟡 VULNERABILITY 16: No Rate Limiting on Item and User Endpoints

**Severity:** Medium  
**Affected Files:**
- `backend/index.js` (lines 44-75)

**Description:**  
Rate limiting is only applied to auth routes and the place-order endpoint. The following endpoints have NO rate limiting:
- `/api/user/current` — user enumeration
- `/api/user/update-location` — spam location updates
- `/api/user/update-fcm-token` — spam FCM token updates
- `/api/item/all` — scraping all menu items
- `/api/item/search-items` — scraping with queries
- `/api/order/my-orders` — order enumeration
- All notification endpoints

**Attack Scenario:**
1. Attacker scrapes the entire menu database by rapidly calling `/api/item/all` and `/api/item/search-items` with different queries.
2. Attacker enumerates users by repeatedly calling `/api/user/current` with different tokens.
3. Attacker spams FCM token updates to corrupt push notification delivery.

**Impact:**
- Data scraping / competitive intelligence gathering
- Resource exhaustion on server and database
- Potential abuse of API quotas

**Evidence:**
```js
// Rate limiters are defined but only applied to 5 specific routes:
app.use("/api/auth/signin", authLimiter)
app.use("/api/auth/signup", authLimiter)
app.use("/api/auth/send-otp", otpLimiter)
app.use("/api/auth/verify-otp", otpLimiter)
app.use("/api/order/place-order", orderLimiter)
// ALL other routes are unrestricted
```

**Recommendation:**  
Apply a global rate limiter with higher limits for general API access. Apply specific stricter limits for auth and order endpoints.

---

## 🟡 VULNERABILITY 17: OTP Verification Race Condition Could Allow Brute-Force

**Severity:** Medium  
**Affected Files:**
- `backend/controllers/auth.controllers.js` (lines 107-122)

**Description:**  
The OTP verification endpoint updates `user.isOtpVerified = true` and then clears `resetOtp`. Between the time the OTP is verified (line 114) and the time the OTP is cleared (lines 115-117), there is a small window where multiple requests could pass. More importantly, there is no rate limiting on individual user OTP attempts beyond the global 5-per-15-minute limit.

**Attack Scenario:**
1. Attacker knows a user's email address.
2. Requests OTP for that email (limited to 5 requests per 15 minutes - but each request sends a new OTP without invalidating the old one).
3. With 5 OTP requests, attacker has 5 different OTPs to try within the 5-minute window.
4. Attacker can now make unlimited `verify-otp` attempts (rate limit is 5 per 15 minutes for ALL requests, but the attacker can distribute across IPs or wait).

**Impact:**
- OTP brute-force possible given enough time and IP rotation
- Password reset bypass if OTP is cracked

**Evidence:**
```js
backend/controllers/auth.controllers.js (lines 88-104):
export const sendOtp = async (req, res) => {
    // ...
    user.resetOtp = otp       // Old OTP is OVERWRITTEN, not invalidated
    user.otpExpires = Date.now() + 5 * 60 * 1000
    user.isOtpVerified = false // Reset
    await user.save()
    await sendOtpMail(email, otp)
    // Multiple OTPs can be generated within 5 minutes — all valid?
}
```

**Recommendation:**  
Sending a new OTP should invalidate the previous one by setting `otpExpires` to past. Implement per-user OTP attempt counting with rate limiting.

---

## 🟡 VULNERABILITY 18: No Notification Ownership Validation on `markNotificationAsRead`

**Severity:** Medium  
**Affected Files:**
- `backend/controllers/notification.controllers.js` (lines 20-37)

**Description:**  
The `markNotificationAsRead` endpoint correctly checks `owner: req.userId` in the query. However, `markAllNotificationsRead` also properly scopes to `owner: req.userId`. These are actually well-implemented. But the notification creation in `createOrderNotifications` stores notifications by `owner._id` regardless of whether the owner exists. If a notification is created with an invalid owner (due to Vulnerability #6), the notification would be orphaned.

**Attack Scenario:**
1. Attacker creates an order with manipulated `owner` field (Vulnerability #6).
2. Notification is created for a non-existent or wrong owner.
3. Legitimate owner never receives the notification.

**Impact:**
- Missed order notifications for restaurant owners
- Business disruption

**Evidence:**
```js
backend/controllers/order.controllers.js (lines 20-69):
async function createOrderNotifications(io, order) {
    for (const shopOrder of order.shopOrders) {
        const ownerId = shopOrder.owner?._id || shopOrder.owner
        if (!ownerId) continue
        // No verification that ownerId corresponds to a real user with role "owner"
        const notification = await Notification.create({
            owner: ownerId, ...
        })
    }
}
```

**Recommendation:**  
Verify that the owner exists and has role "owner" before creating notifications.

---

## 🟡 VULNERABILITY 19: Redis / Session Store Missing — Server Restart Invalidates All Sessions

**Severity:** Medium  
**Affected Files:**
- `backend/index.js` (no session configuration)

**Description:**  
The application uses JWT tokens with a 7-day expiry stored in cookies. There is no Redis-backed session store or token blacklist. If the JWT secret is ever rotated or the server restarts with session state, there is no way to invalidate tokens server-side. A logged-out user's token remains valid until its natural 7-day expiry.

**Attack Scenario:**
1. User logs out via `/api/auth/signout` which clears the cookie but the token itself is still valid.
2. Attacker who previously captured the token can still use it.
3. There is no token blacklist (the server just clears the cookie client-side).

**Impact:**
- Stolen tokens remain valid even after logout
- No ability to force logout all sessions
- Token replay after logout

**Evidence:**
```js
backend/controllers/auth.controllers.js (lines 79-86):
export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")  // Only clears the cookie, token remains valid
        return res.status(200).json({ message: "log out successfully" })
    } catch (error) {
        return res.status(500).json(`sign out error ${error}`)
    }
}
```

**Recommendation:**  
Implement a token blacklist using Redis or a MongoDB collection. Check blacklist in the `isAuth` middleware. Alternatively, use shorter token lifetimes with refresh tokens.

---

## 🟡 VULNERABILITY 20: Delivery OTP Stored Plaintext in Database

**Severity:** Medium  
**Affected Files:**
- `backend/models/order.model.js` (lines 35-38)
- `backend/controllers/order.controllers.js` (lines 609-612)

**Description:**  
The delivery OTP is stored as plaintext in the `shopOrder.deliveryOtp` field. Anyone with read access to the database (or who can exploit IDOR) can read the delivery OTP and verify delivery fraudulently.

**Attack Scenario:**
1. Database is compromised (Vulnerability #2 — MongoDB credentials exposed).
2. Attacker queries the orders collection.
3. Reads `deliveryOtp` for any undelivered order.
4. Calls `verify-delivery-otp` to mark delivery as completed.
5. Claims delivery fee/payment fraudulently.

**Impact:**
- Fraudulent delivery completion
- Financial fraud against the platform

**Evidence:**
```js
backend/controllers/order.controllers.js (lines 609-612):
const otp = Math.floor(1000 + Math.random() * 9000).toString()
shopOrder.deliveryOtp = otp  // Stored as PLAINTEXT in database
shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
await order.save()
```

**Recommendation:**  
Store a hashed version of the OTP (e.g., SHA-256). Compare hashes during verification. This is a 4-digit code with only 10,000 possibilities, but hashing still prevents database-read-based attacks.

---

## 🟢 VULNERABILITY 21: Insecure Direct Object Reference on `getItemById`

**Severity:** Low  
**Affected Files:**
- `backend/controllers/item.controllers.js` (lines 50-59)
- `backend/routes/item.routes.js` (line 55)

**Description:**  
The `getItemById` endpoint returns full item details to any authenticated user. There's no ownership validation — any user can view any item. While this may be intended functionality (menu items should be public), it exposes `owner` ObjectId which can be used for user enumeration.

**Attack Scenario:**
1. Authenticated user calls `/api/item/get-by-id/:itemId` with various item IDs.
2. Can probe for which items exist (ID enumeration).
3. Gets `owner` ObjectId — can be used to look up owner information.

**Impact:**
- Limited information disclosure
- User/owner ID enumeration

**Evidence:**
```js
backend/controllers/item.controllers.js (lines 50-59):
export const getItemById = async (req, res) => {
    const item = await Item.findById(itemId)
    if (!item) return res.status(400).json({ message: "item not found" })
    return res.status(200).json(item)  // Returns FULL item object including owner ref
}
```

**Recommendation:**  
This is the intended design for menu visibility. However, consider whether `owner` should be exposed. If needed, limit to just the owner name rather than ObjectId.

---

## 🟢 VULNERABILITY 22: No Pagination on List Endpoints

**Severity:** Low  
**Affected Files:**
- `backend/controllers/item.controllers.js` (lines 77-85, 87-94)
- `backend/controllers/order.controllers.js` (lines 307-337)

**Description:**  
The `getAllItems`, `getMyItems`, and `getMyOrders` endpoints return ALL results at once without pagination. As the database grows, these responses will become extremely large, consuming server memory and bandwidth.

**Attack Scenario:**
1. Attacker calls `/api/item/get-all` repeatedly.
2. Each response grows as more items are added.
3. Server memory and bandwidth are exhausted (amplified DoS).

**Impact:**
- Potential denial of service
- Large response sizes affecting mobile users
- Slow API responses

**Evidence:**
```js
backend/controllers/item.controllers.js (lines 77-85):
export const getAllItems = async (req, res) => {
    const items = await Item.find({}).populate("owner", "fullName _id")
    // No limit, no pagination — returns ALL items
    return res.status(200).json(validItems)
}
```

**Recommendation:**  
Implement pagination using `.skip()` and `.limit()` or cursor-based pagination. Set a reasonable default limit (e.g., 50 items per page).

---

## 🟢 VULNERABILITY 23: CORS Allows Single Origin with Credentials

**Severity:** Low  
**Affected Files:**
- `backend/index.js` (lines 35-38)

**Description:**  
CORS is configured with a single allowed origin (`ALLOWED_ORIGIN` env var) with credentials enabled. While this is relatively restrictive, the `ALLOWED_ORIGIN` defaults to `http://localhost:5173` if not set, which in production would need to be explicitly configured. If misconfigured in production, this could allow cross-origin requests.

**Attack Scenario:**
1. If a developer deploys without setting `ALLOWED_ORIGIN` in production, it defaults to `http://localhost:5173`.
2. The production server would not respond to requests from the actual frontend domain.
3. Or worse, if set too broadly (e.g., `*`), allows any website to make authenticated requests.

**Impact:**
- Potential CSRF-like attacks if origin is too permissive
- Production misconfiguration could break the application

**Evidence:**
```js
backend/index.js (lines 21, 35-38):
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173"

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}))
```

**Recommendation:**  
Ensure `ALLOWED_ORIGIN` is properly configured in production. Add validation to reject the localhost default in production mode. Consider implementing a whitelist of allowed origins.

---

## 🔵 NOTABLE: FIXED / PROPERLY MITIGATED ISSUES

The following areas show evidence of attempted security fixes and are properly implemented:

1. **Payment Verification** — Razorpay signature verification is properly implemented (order.controllers.js lines 239-247). The `verifyPayment` endpoint:
   - Verifies HMAC-SHA256 signature
   - Checks that payment is not already marked as paid (replay prevention)
   - Checks that payment_id is not used in another order
   - Verifies razorpay_order_id matches the order

2. **Price Recalculation** — `placeOrder` recalculates prices from the database instead of trusting frontend values (order.controllers.js lines 119-145).

3. **Ownership Verification on Order Status Update** — The `updateOrderStatus` endpoint verifies that the requesting user matches the ownerId param AND has role "owner" (lines 344-351).

4. **Order Access Control** — `getOrderById` checks that the user is either the order owner or the customer (lines 581-587).

5. **Delivery OTP Authorization** — Both `sendDeliveryOtp` and `verifyDeliveryOtp` verify that only the assigned delivery boy can send/verify OTP (lines 604-607, 630-632).

6. **Role Fix on Frontend** — The signup page no longer allows role selection (role is hardcoded to "user").

7. **Express-Validator** — Input validation is applied to most critical endpoints.

8. **Item Ownership** — `editItem` and `deleteItem` verify `owner: req.userId` before modifying.

9. **File Upload** — Multer is configured with file type filtering (images only) and 5MB size limit. Original filenames are not used (path traversal mitigation).

---

## Summary Statistics

### By Severity

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 7 |
| Medium | 9 |
| Low | 3 |
| **Total** | **23** |

### Key Questions

| Question | Answer |
|----------|--------|
| Can payment be bypassed? | **NO** — Signature verification + replay protection + DB price recalculation properly implemented |
| Can orders be created without payment? | **NO** — COD orders are valid by design; online orders require Razorpay |
| Can privilege escalation occur? | **YES** — Weak JWT secret allows forging tokens for any role |
| Can any user access another user's data? | **YES** — JWT forgery allows impersonation; weak secret exposes all data |
| Are secrets committed to repository? | **YES** — Firebase key, DB credentials, API keys all in committed files |
| Is the database exposed? | **YES** — MongoDB credentials in committed .env file |

---

## Top 10 Most Dangerous Vulnerabilities

1. **🔴 Fireabase Service Account Key Committed to Git** — VULN-1
2. **🔴 All API Credentials Exposed in `.env` Files** — VULN-2
3. **🔴 Weak JWT Secret Enables Full Account Takeover** — VULN-3
4. **🔴 Password Hashes Exposed to Client** — VULN-4
5. **🟠 No Auth on search-items Endpoint** — VULN-5
6. **🟠 Client-Supplied Owner ID in Order Placement** — VULN-6
7. **🟠 Delivery Range Bypass via Invalid Coordinates** — VULN-7
8. **🟠 Race Condition in Delivery Acceptance** — VULN-8
9. **🟠 Cookie secure: false Enables Session Hijacking** — VULN-9
10. **🟠 Weak Email Password with SMTP Access** — VULN-13

---

## Final Assessment

**Critical Risk.** The combination of exposed credentials (Firebase, MongoDB, Gmail, Razorpay, Cloudinary, Mapbox) in the committed repository, combined with a weak JWT secret that enables full account takeover, makes this application trivially exploitable. An attacker who simply clones the repository gains:
- Full database access
- Email account access
- Media storage access
- Payment system access
- Ability to forge authentication tokens

The payment verification flow is **properly secured** (signature verification, replay protection, price recalculation), but all other security boundaries are compromised by the credential exposure.

**Action Required Immediately:**
1. Rotate ALL credentials listed in the `.env` files
2. Rotate the Firebase service account key
3. Remove all credential files from Git history
4. Generate a new strong JWT secret
5. Deploy with secrets management (environment variables only)