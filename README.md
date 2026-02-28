# Yeodeun (여든)
## About

Proof-of-concept for a restaurant foodservice order management application.
Yeodeun logo            |  storefront image
:-------------------------:|:-------------------------:
<img src="https://github.com/apacific/yeodeun/blob/main/yeodeun-logo.png?raw=true" width="333" height="333">  |  <img src="https://github.com/apacific/yeodeun/blob/main/store-front.png?raw=true" width="333" height="333">
# Features

## Domain and Business Rules

### Frontend

- workflow(s)

-  UI and Layout

    - Restaurant Menu

        - Nutrition Facts available for all items via USDA FoodData Central
            - Updated whenever API is started, as well as via admin-only endpoint

    - English, Korean, Japanese language support across all screens/views

- Create and edit order

- Checkout and payment processing

- Customer feedback form


- Cross-platform compatibility

- Responsive design

# Technology Stack

## Setup and Run

#### System Requirements

Docker Desktop

An Android or iOS (Apple) phone / tablet with Expo Go app, or a suitable emulator


### API: Admin JWT Setup (Nutrition Endpoints)

Admin endpoints under `api/admin/nutrition/*` require:
- a valid JWT Bearer token
- `role: Admin` claim
- allowed environment/IP checks from API config

Set required environment variables before running Docker Compose:

```powershell
$env:USDA_FDC_API_KEY = "your-usda-key"
$env:ADMIN_JWT_KEY = "your-strong-jwt-signing-key"
docker compose up --build
```

Generate a development JWT in PowerShell (HS256):

```powershell
$key = $env:ADMIN_JWT_KEY
$issuer = "yeodeun-api"
$audience = "yeodeun-admin"

function To-Base64Url([byte[]]$bytes) {
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}

$headerJson = '{"alg":"HS256","typ":"JWT"}'
$exp = [DateTimeOffset]::UtcNow.AddHours(2).ToUnixTimeSeconds()
$payloadJson = "{`"iss`":`"$issuer`",`"aud`":`"$audience`",`"sub`":`"local-admin`",`"role`":`"Admin`",`"exp`":$exp}"

$header = To-Base64Url([Text.Encoding]::UTF8.GetBytes($headerJson))
$payload = To-Base64Url([Text.Encoding]::UTF8.GetBytes($payloadJson))
$unsigned = "$header.$payload"

$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($key))
$sig = To-Base64Url($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsigned)))
$token = "$unsigned.$sig"
$token
```

Use the token:

```powershell
$token = "<paste-token>"
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Get `
  -Uri http://localhost:5010/api/admin/nutrition/audit `
  -Headers $headers

Invoke-RestMethod -Method Post `
  -Uri http://localhost:5010/api/admin/nutrition/usda-refresh `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"forceRefresh": true}'
```

### Production Security Notes

- Rotate `ADMIN_JWT_KEY` regularly and keep it in secret storage.
- Keep `AdminEndpoints:RequireDevelopment` enabled unless you intentionally expose admin endpoints in a protected environment.
- Use `AdminEndpoints:AllowedIpAddresses` to restrict admin endpoint source IPs.
- In non-local runs, keep USDA seeding disabled by default (`NUTRITION_SEEDING_USDA_ENABLED=false`) and trigger refresh explicitly with admin auth.

### Docker Compose Modes

Default compose (`docker-compose.yml`) is now non-local-safe by default:
- `ASPNETCORE_ENVIRONMENT` defaults to `Production`
- USDA auto-seeding defaults to disabled
- Postgres port is not published to host

For local development (DB port published + Development env + USDA auto-seeding), run:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

For non-local runs, use only base compose:

```powershell
docker compose up --build
```

## Testing

#### Frontend (unit + component integration)

```powershell
cd services/mobile
npm test -- --runInBand
```

Coverage report:

```powershell
cd services/mobile
npm run test:coverage
```

#### Backend (unit + integration + API e2e)

```powershell
cd services/api
dotnet test Yeodeun.slnx -v minimal
```

Targeted runs:

```powershell
cd services/api
dotnet test tests/Yeodeun.Application.Tests/Yeodeun.Application.Tests.csproj -v minimal
dotnet test tests/Yeodeun.Api.IntegrationTests/Yeodeun.Api.IntegrationTests.csproj -v minimal
dotnet test tests/Yeodeun.Api.EndToEndTests/Yeodeun.Api.EndToEndTests.csproj -v minimal
```

#### Mobile End-to-End (device smoke flow)

The repository includes a Maestro flow at:

- `services/mobile/e2e/maestro/smoke-order-flow.yaml`

Run it with Maestro CLI installed and Expo Go open on a connected device/emulator:

```powershell
cd services/mobile
npm run test:e2e:maestro
```

#### Run All Tests

1. `cd services/api && dotnet test Yeodeun.slnx -v minimal`
2. `cd services/mobile && npm test -- --runInBand`
3. `cd services/mobile && npm run test:e2e:maestro` (optional device e2e smoke)
