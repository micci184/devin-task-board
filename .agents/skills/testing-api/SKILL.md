# Testing devin-task-board API

## Overview
This skill covers how to test REST API endpoints for the devin-task-board project locally.

## Devin Secrets Needed
None required — local development uses hardcoded credentials.

## Environment Setup

### 1. Start Database
```bash
cd ~/repos/devin-task-board && docker compose up db -d
```

### 2. Push Schema & Seed Data
Note: This project may not have migration files. Use `prisma db push` if `prisma migrate deploy` reports no migrations.
```bash
npx prisma db push
npx prisma db seed
```

### 3. Start Dev Server
```bash
npm run dev
# Runs on http://localhost:3000
```

## Authentication for curl Testing

The app uses NextAuth v5 with JWT strategy. To authenticate via curl:

```bash
# Step 1: Get CSRF token
CSRF_RESPONSE=$(curl -s -c /tmp/cookies.txt http://localhost:3000/api/auth/csrf)
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).csrfToken))")

# Step 2: Login
curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@example.com&password=password123&csrfToken=$CSRF_TOKEN" \
  -o /dev/null -w "Login status: %{http_code}\n"

# Step 3: Use cookies for authenticated requests
curl -s -b /tmp/cookies.txt http://localhost:3000/api/projects
```

## Seed Data

| User | Email | Password | Role | Project Role |
|------|-------|----------|------|-------------|
| Admin | admin@example.com | password123 | ADMIN | OWNER of "Devin Task Board" |
| Member | member@example.com | password123 | MEMBER | MEMBER of "Devin Task Board" |

Seed project: "Devin Task Board" (key: DTB), with 2 tasks and 2 members.

## Common Test Patterns

### Capture HTTP status with response body
```bash
RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}" -b /tmp/cookies.txt URL)
HTTP_STATUS=$(echo "$RESPONSE" | grep "__HTTP_STATUS__" | sed 's/__HTTP_STATUS__//')
BODY=$(echo "$RESPONSE" | grep -v "__HTTP_STATUS__")
```

### Test authorization (switch users)
Create separate cookie jars for different users (e.g., `/tmp/cookies_admin.txt`, `/tmp/cookies_member.txt`).

## Known Issues
- `next lint` may fail with `Invalid project directory` error — this is a pre-existing config issue, not related to API changes
- `prisma migrate deploy` may report no migrations if the project uses `prisma db push` workflow instead
- The bcrypt password hash in seed.ts corresponds to `password123`

## API Response Format
- Success: `{ data: T }`
- Error: `{ error: { code: string, message: string } }`
- Status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
