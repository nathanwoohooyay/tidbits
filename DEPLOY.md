# Deploying Tidbits to AWS (EC2 + S3/CloudFront)

```
Browser ──https──> CloudFront (client)  ── /*      ──> S3 bucket /client
                                        └─ /api/*  ──> EC2 :8090 ─┐
Browser ──https──> CloudFront (audit)   ── /*      ──> S3 bucket /audit
                                        └─ /api/*, /auth-api/*, /metrics-api/* ──> EC2 :8084 ─┤
                                                                                              v
                     EC2 (docker compose -f docker-compose.aws.yml): edge nginx, gateway, auth,
                     client-service, audit-service, metrics-service, kafka, postgres
```

## What changes, and what doesn't

- **API URLs: no change.** The frontends keep calling relative paths like `/api/...`. CloudFront serves the app and
  forwards those paths to EC2 from the **same domain**, so the browser treats every call as same-origin.
- **CORS: config only.** Same-origin calls don't need CORS. Set `AUTH_CORS_ORIGINS` / `GATEWAY_CORS_ORIGINS` to your
  two CloudFront URLs anyway, so they no longer list localhost.
- **nginx routing:** the frontends' `nginx.conf` used to route `/api` and the other API paths. That job now belongs to
  [deploy/nginx-edge.conf](deploy/nginx-edge.conf) on EC2 (same routes, no static files).
- **Client IP:** auth's login throttling reads `X-Real-IP`. The edge nginx takes the real visitor IP from CloudFront's
  `X-Forwarded-For` header.
- **Deep links** (refreshing `/portfolio`, say): S3 has no such file, so
  [deploy/cloudfront-spa-rewrite.js](deploy/cloudfront-spa-rewrite.js) serves `index.html` for those paths.
- **Database:** Postgres runs on EC2 in Docker, the same way it does locally. It initializes from `db/*.sql` the
  first time it starts and keeps its data in the `postgres_data` volume.

---

## 1. EC2 security group

| Type | Port | Source |
|---|---|---|
| SSH | 22 | My IP |
| Custom TCP | 8084-8090 | Prefix list `com.amazonaws.global.cloudfront.origin-facing` |

Use a single port *range* rule. The CloudFront prefix list counts as about 55 rules against the default 60-rule
quota. Don't open 5432, 3000 or 4000: Postgres and the services are reachable only inside Docker.

## 2. Prepare the EC2 instance

The instance needs at least **4 GB RAM** (t3.medium). It runs Postgres, Kafka and two Spring Boot services, and it
builds them with Maven. Give it an **Elastic IP** (EC2 → Elastic IPs → Allocate → Associate) so its address stays
the same, and copy its **Public IPv4 DNS** (`ec2-…amazonaws.com`).

SSH in. These commands are for Amazon Linux 2023. On Ubuntu, use `curl -fsSL https://get.docker.com | sh` instead.

```bash
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo curl -SL "https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.linux-$( [ "$(uname -m)" = aarch64 ] && echo arm64 || echo amd64 )" -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/*
exit   # log back in so the docker group applies
```

If the instance has less than 8 GB of RAM, add swap so the Maven builds don't run out of memory:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

## 3. Start the backend

If the repo is private, git asks for your GitHub username and a personal access token.

```bash
git clone https://github.com/nathanwoohooyay/tidbits.git && cd tidbits
cp deploy/.env.aws.example .env && nano .env      # DB password, new JWT_SECRET, API key
docker compose -f docker-compose.aws.yml up -d --build
docker compose -f docker-compose.aws.yml ps
curl -s localhost:8090/api/auth/health            # should answer from auth-service
```

Leave the CORS lines as placeholders for now. You'll fill them in at step 4.

The database is seeded **only on the first start**, when its volume is empty. Changing the `DB_*` values later doesn't
change the existing database. `down -v` wipes the database and reseeds it.

Logs: `docker compose -f docker-compose.aws.yml logs -f gateway` (or any service name).
Database shell: `docker compose -f docker-compose.aws.yml exec postgres psql -U postgres tidbits_dev`.

## 4. S3 + CloudFront

**Bucket.** Use your existing bucket. Keep **Block all public access ON**: CloudFront reads the bucket privately, so
**don't** turn on S3 static website hosting. The two frontends go under the `client/` and `audit/` prefixes.

**CloudFront Function.** CloudFront → Functions → Create `tidbits-spa-rewrite`. Paste in
[deploy/cloudfront-spa-rewrite.js](deploy/cloudfront-spa-rewrite.js), then Save and **Publish**.

**Create two distributions.** Do this once for `client` (EC2 port **8090**) and once for `audit` (EC2 port **8084**):

1. Create distribution → Origin domain: pick your S3 bucket. **Origin path: `/client`** (or `/audit`).
   Origin access: **Origin access control settings** → create an OAC.
   - Default behavior: Viewer protocol policy *Redirect HTTP to HTTPS*, cache policy *CachingOptimized*.
     Under Function associations, set **Viewer request → CloudFront Functions → `tidbits-spa-rewrite`**.
   - WAF: do not enable (it costs extra). Default root object: `index.html`.
2. After it's created, copy the **bucket policy** CloudFront shows you into S3 → bucket → Permissions → Bucket policy.
   With the second distribution, add its ARN to the same policy's `AWS:SourceArn` condition (as a list) instead of
   replacing the policy.
3. Origins tab → Create origin → Origin domain: **your EC2 Public IPv4 DNS**. Protocol **HTTP only**,
   HTTP port **8090** (client) or **8084** (audit).
4. Behaviors tab → Create behavior, pointing at the EC2 origin:
   - Client distribution: `/api/*`
   - Audit distribution: `/api/*`, `/auth-api/*`, `/metrics-api/*` (one behavior per path)
   - For each: Viewer protocol *Redirect HTTP to HTTPS*, Allowed methods **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**,
     Cache policy **CachingDisabled**, Origin request policy **AllViewerExceptHostHeader**. No function association.

   Don't add custom error responses (403/404 → index.html) to the distribution. They apply to the API too, and they
   would replace API errors with the HTML page. The CloudFront Function already handles deep links.

Copy both distributions' domain names (`dxxxx.cloudfront.net`) and IDs (`E…`). On EC2, set the domains in
`AUTH_CORS_ORIGINS` / `GATEWAY_CORS_ORIGINS` in `.env`, then run `docker compose -f docker-compose.aws.yml up -d`
to apply the change.

## 5. Upload the frontends (from your PC)

Install the AWS CLI (`winget install Amazon.AWSCLI`) and run `aws configure` with an IAM user's access key.
Then, from Git Bash in the repo root:

```bash
BUCKET=your-bucket CLIENT_DIST_ID=E… AUDIT_DIST_ID=E… ./deploy/deploy-frontends.sh
```

Open `https://<client distribution>.cloudfront.net` and log in.

## Updating later

- Backend: SSH in, `git pull`, then `docker compose -f docker-compose.aws.yml up -d --build`.
- Frontends: run `deploy-frontends.sh` again.

## Notes

- **Back up the database:** it lives on the instance's disk. You can dump it with
  `docker compose -f docker-compose.aws.yml exec postgres pg_dumpall -U postgres > backup.sql`, or snapshot the EBS volume.
- **Traffic between CloudFront and EC2 is plain HTTP.** Browser → CloudFront is HTTPS. To encrypt the second hop too,
  get a domain, point a subdomain at the Elastic IP, put a certificate on the edge nginx, and change the origin
  protocol to HTTPS.
