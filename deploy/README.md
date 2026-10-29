# Deploying to S3, CloudFront and EC2

The two web apps are static files in S3. The backend (auth, gateway, services, Postgres, Kafka) runs with Docker
Compose on the EC2 instance at `3.237.96.157`. One CloudFront distribution per app puts both behind a single HTTPS
address:

```
browser ──https──> CloudFront ─┬─ /*            → S3 bucket (the built app)
                               └─ /api/* etc.   → EC2 nginx (client :8090, audit :8084) → services
```

Because the browser only ever talks to the CloudFront address, the apps keep calling relative paths (`/api/...`),
there is no CORS, and the sign-in refresh cookie works. Nothing in the frontend code names the EC2 address; it lives
only in the CloudFront origin settings below.

| App | S3 bucket holds | Paths sent to EC2 | EC2 port |
|---|---|---|---|
| Client (trading) | `client-frontend/dist/client-frontend/browser` | `/api/*` | 8090 |
| Audit | `audit-frontend/dist/audit-frontend/browser` | `/api/*`, `/auth-api/*`, `/metrics-api/*` | 8084 |

## 1. EC2

1. **Give the instance an Elastic IP.** A plain public IP changes when the instance is stopped and started, and
   CloudFront would lose the backend. If you attach one, use its DNS name in step 3.
2. **Find its public DNS name.** CloudFront origins must be a domain name, not an IP. In the EC2 console it's
   "Public IPv4 DNS", e.g. `ec2-3-237-96-157.compute-1.amazonaws.com`.
3. **In the `.env` on the instance**, add:
   ```
   AUTH_COOKIE_SECURE=true
   ```
   so the refresh cookie is only sent over HTTPS.
4. **Start the stack:** `docker-compose up -d --build`.
5. **Security group, inbound rules:**
   - Ports **8090** and **8084**: allow **only** the managed prefix list
     `com.amazonaws.global.cloudfront.origin-facing`. This matters: nginx trusts the `CloudFront-Viewer-Address`
     header for the visitor's IP (login-attempt limits and audit logs), and anyone who can reach these ports directly
     could forge it. The prefix list counts as many rules toward the group's rule limit; if AWS refuses it, put it in
     its own security group.
   - Remove public access to **3000** (gateway) and **5432** (Postgres). Browsers no longer need them. Keep SSH (22)
     limited to your own IP.

## 2. S3

Create one private bucket per app (block all public access stays on). CloudFront reads them through Origin Access
Control, set up in step 3.

## 3. CloudFront (one distribution per app)

**Origins**

- **S3**: the app's bucket (the REST endpoint, not the website endpoint), with **Origin access control**. CloudFront
  offers to update the bucket policy; accept it.
- **EC2**: origin domain = the public DNS name from step 1.2. Protocol **HTTP only**, HTTP port **8090** (client)
  or **8084** (audit).

**Behaviours**

| Path pattern | Origin | Methods | Cache policy | Origin request policy |
|---|---|---|---|---|
| `/api/*` (audit also `/auth-api/*`, `/metrics-api/*`) | EC2 | GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE | `CachingDisabled` | `AllViewerAndCloudFrontHeaders-2022-06` |
| Default (`*`) | S3 | GET, HEAD | `CachingOptimized` | none |

On every behaviour set **Viewer protocol policy → Redirect HTTP to HTTPS**. The API behaviours' origin request policy
must pass the viewer's headers (`Authorization`, cookies) and `CloudFront-Viewer-Address` through to EC2, which
`AllViewerAndCloudFrontHeaders-2022-06` does.

**Page routes:** create a CloudFront Function from [`cloudfront-spa-routing.js`](cloudfront-spa-routing.js),
publish it, and attach it to the **default behaviour** as a *viewer request* function. It serves `index.html` for
routes like `/dashboard`.

Don't use custom error responses (403/404 → `/index.html`) for this: they apply to the API behaviours too, and would
turn real API errors (an auditor's 403, a missing order's 404) into the app's HTML page.

**Settings:** default root object `index.html`.

## 4. Build and upload

From the repo root, for each app (client shown; for the audit app use `audit-frontend`, its bucket and distribution):

```bash
cd client-frontend
npm install
npx ng build                      # production build: relative /api paths

aws s3 sync dist/client-frontend/browser s3://CLIENT_BUCKET --delete \
  --cache-control "public,max-age=3600"
aws s3 cp dist/client-frontend/browser/index.html s3://CLIENT_BUCKET/index.html \
  --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id CLIENT_DISTRIBUTION_ID --paths "/index.html"
```

`index.html` is never cached, so a new upload shows up straight away; everything else is cached for an hour.

## 5. Check it

1. Open `https://<distribution>.cloudfront.net`, sign in, then reload on a deep page (e.g. `/dashboard`). The page
   should come back, not an error.
2. Stay signed in for more than 15 minutes and keep using the app. You should not be signed out: the refresh cookie
   renews your session.
3. In the audit app, Audit logs → User activity: your sign-in should show **your** IP address, not a CloudFront one.
4. From your own machine, `curl http://3.237.96.157:8090/` should time out (only CloudFront may reach it).
