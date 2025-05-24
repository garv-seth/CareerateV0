# Careerate V0 – Azure Cloud Deployment

## Overview
Production-ready, full-stack Careerate V0 deployed on Azure Web Apps with Cosmos DB, Blob Storage, Redis, and Azure AD. CI/CD via GitHub Actions. Custom domain: gocareerate.com (GoDaddy).

---

## 1. Infrastructure Setup (Terraform)

- Install [Terraform](https://www.terraform.io/downloads.html)
- `cd infra`
- `terraform init`
- `terraform apply` (follow prompts, set up Azure credentials)
- Outputs will include:
  - Web App URL
  - Cosmos DB connection string
  - Storage account name
  - Redis hostname
  - Key Vault URI
  - Azure AD App ID

## 2. GoDaddy DNS Setup
- In GoDaddy, add a CNAME record for `www` pointing to the Azure Web App URL output by Terraform.
- For root domain, use forwarding or an A record as per Azure docs.
- Enable SSL in Azure Portal (App Service > TLS/SSL).

## 3. GitHub Actions CI/CD
- On push to `main`, GitHub Actions will:
  - Build & test frontend and backend
  - Deploy to Azure Web App
- Store all secrets (Cosmos DB, Storage, Redis, Key Vault, Azure AD) in GitHub Secrets.
- Use OIDC for secure secret injection.

## 4. Local Development
- Copy `.env.example` to `.env` in both `client/` and `api/`.
- Fill in values from Terraform outputs or Azure Portal.
- Run backend: `cd api && npm install && npm run dev`
- Run frontend: `cd client && npm install && npm run dev`

## 5. Environment Variables
- All config is via env vars (see `.env.example`).
- Never commit secrets to the repo.

## 6. Azure Resource Management
- All resources are managed via Terraform in `infra/`.
- To destroy: `terraform destroy`

## 7. Support
- For issues, open a GitHub issue or contact the maintainer.

---

**You are now ready to launch Careerate V0 on Azure!** 