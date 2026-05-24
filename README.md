# DataBridge

A multi-organization data management and transfer system built with Next.js, 
Neon Postgres, and Upstash Redis.

## What is this?

DataBridge allows two organizations to securely log in, manage their own data 
rows, and transfer data between each other with email notifications.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 15 (App Router) |
| Database | Neon Serverless Postgres |
| Authentication | JWT + OTP via Email |
| Email | Nodemailer with Gmail SMTP |
| Rate Limiting | Upstash Redis |
| Deployment | Vercel |

## Architectural Choices

### Next.js App Router
Next.js gives us both frontend and backend in one project. API routes handle 
all backend logic. No need for a separate Express server. This keeps the 
codebase simple and deployment easy.

### Neon Postgres
Neon is a serverless Postgres database that scales to zero when not in use. 
It works perfectly with Vercel because both are serverless. It supports 
standard SQL so the schema is straightforward and easy to understand.

### JWT for Sessions
After OTP verification a signed JWT is stored in an httpOnly cookie. This 
means the session is stateless — no session table needed in the database. 
The JWT contains the user's org information so every API request knows which 
org is making the request without an extra database lookup.

### OTP Authentication
No passwords to store or hash. Users get a 6 digit code sent to their email 
that expires in 10 minutes and can only be used once. This is more secure 
than passwords for this use case.

### Soft Deletes
Instead of permanently deleting rows from the database we set 
`is_deleted = TRUE`. This preserves data history and makes recovery possible. 
All queries filter `WHERE is_deleted = FALSE`.

### Single INSERT SELECT for Transfer
Instead of fetching rows into JavaScript and inserting them in batches, we 
use a single SQL query that copies rows directly inside the database. This is 
dramatically faster and reduces network round trips.

### Data Isolation After Transfer
When Org A transfers to Org B, rows are copied with `org_id = Org B`. After 
that point each org adds rows independently. They never share data again. 
This is enforced at the database level by always filtering 
`WHERE org_id = session.orgId`.

### Upstash Redis for Rate Limiting
Vercel runs serverless functions which means in-memory rate limiting does not 
work — each request can hit a different server instance. Upstash Redis is a 
serverless Redis that persists rate limit counters across all instances.

## Database Schema

```sql
organizations  -- stores org name, slug, email
users          -- one user per org, linked by org_id
otp_tokens     -- stores login codes with expiry
data_rows      -- org data with soft delete and transfer link
transfers      -- audit trail of all transfers between orgs
audit_logs     -- logs all key events for monitoring
```

## Environment Variables Setup

Create a `.env.local` file in the root of the project and add these:

```env
# Neon Database
DATABASE_URL=your_neon_connection_string

# JWT Authentication
JWT_SECRET=any_long_random_string_at_least_32_characters

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_character_gmail_app_password
EMAIL_FROM=DataBridge <your_gmail_address@gmail.com>

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### How to get each value

**DATABASE_URL**
Go to neon.tech → your project → Connection Details → copy the connection string

**JWT_SECRET**
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**SMTP_USER and SMTP_PASS**
Go to Google Account → Security → 2 Step Verification → App Passwords → 
create a new app password → copy the 16 character password

**UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN**
Go to upstash.com → create a Redis database → REST API section → 
copy the URL and token

## Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# Install dependencies
cd multi-org-transfer-system
npm install

# Add environment variables
# Create .env.local and add all variables listed above

# Run the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## Seeding the Database

```bash
npx ts-node --project tsconfig.seed.json scripts/seed.ts
```

## How to Test the App

1. Go to the login page
2. Enter the registered email for Organization A
3. Check your inbox for the OTP code
4. Enter the code to access the dashboard
5. You will see 500 rows of data
6. Use the Transfer button to send data to Organization B
7. Organization B will receive an email notification
8. Log out and log in as Organization B to see the transferred data

## Security Features

- OTP codes expire in 10 minutes and are single use
- JWT tokens expire in 8 hours
- Cookies are httpOnly and secure in production
- Rate limiting on all sensitive endpoints
- Input validation on all API routes
- SQL injection prevented by parameterized queries
- Security headers on all responses
- Users can only access their own organization dashboard

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/send-otp | Request OTP code |
| POST | /api/auth/verify-otp | Verify OTP and login |
| POST | /api/auth/logout | Logout and clear session |
| GET | /api/rows/list | List paginated rows |
| GET | /api/rows/search | Search rows |
| POST | /api/rows/add | Add new row |
| DELETE | /api/rows/delete | Soft delete a row |
| POST | /api/transfer | Transfer data to other org |
| GET | /api/transfer | Get transfer history |
| GET | /api/org/profile | Get org profile and stats |
| GET | /api/org/notifications | Get received transfers |

```

---

Paste the reply here.
