# MIRA Beauty Shop – unified JavaScript deployment

The project keeps the existing React/Vite frontend and Express backend, but the production runtime is a single Node.js/Express application and one Docker image. Express serves `frontend/dist` and handles `/api/*`. SQL Server remains an external database (for example AWS RDS).

## Local development

1. Copy `backend/.env.example` to `backend/.env` and fill in your own local SQL Server credentials.
2. Install dependencies:
   ```powershell
   npm run install:all
   ```
3. Start backend:
   ```powershell
   npm start
   ```
4. In another terminal, start Vite:
   ```powershell
   npm run dev:frontend
   ```
   For Vite development, configure `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`.
5. Production-like local test:
   ```powershell
   npm run build
   npm start
   ```
   Open http://localhost:5000 and test http://localhost:5000/api/health.

## Docker (one image)

Build from the repository root:
```powershell
docker build -t mira-beauty-shop:latest .
```
Run (supply database values via environment variables; do not bake secrets into the image):
```powershell
docker run --rm -p 5000:5000 `
  -e PORT=5000 `
  -e DB_SERVER="YOUR_RDS_ENDPOINT" `
  -e DB_NAME="MiraBeautyShopDb" `
  -e DB_USER="YOUR_SQL_LOGIN" `
  -e DB_PASSWORD="YOUR_PASSWORD" `
  -e DB_ENCRYPT=true `
  -e DB_TRUST_SERVER_CERTIFICATE=true `
  -e TOKEN_SECRET="YOUR_LONG_RANDOM_SECRET" `
  mira-beauty-shop:latest
```

Test:
- http://localhost:5000/
- http://localhost:5000/api/health
- http://localhost:5000/api/db-check

## AWS deployment notes

- Push this single image to one ECR repository.
- Run one ECS Fargate service/container with container port 5000.
- Inject `DB_PASSWORD` from AWS Secrets Manager in the ECS task definition; do not put it in the image or source control.
- Set `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_ENCRYPT=true`, `DB_TRUST_SERVER_CERTIFICATE=true`, and a strong `TOKEN_SECRET` as task environment/secrets.
- RDS security group inbound TCP 1433 should allow only the ECS task security group, not `0.0.0.0/0`.
- ECS and RDS must be in a network configuration that permits private connectivity.
- After changing a Secrets Manager value, deploy new ECS tasks so the container reads the new secret.
- The existing database login failure (`miraadmin`) is an AWS SQL authentication issue; this code change does not reset that SQL Server password.

## Important

The archive intentionally excludes `.env`, `node_modules`, `.git`, and build output. Existing `.env` values from the supplied archive are not copied because they contained sensitive credentials. Create local `.env` from the examples and set AWS values in ECS/Secrets Manager.
