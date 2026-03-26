# Yeodeun (여든)
## About

Proof-of-concept for a restaurant foodservice order management application.

<img src="https://github.com/apacific/yeodeun/blob/main/yeodeun-logo.png?raw=true" width="333" height="333">  |  <img src="https://github.com/apacific/yeodeun/blob/main/store-front.png?raw=true" width="333" height="333">

### Home Page

<img src="https://github.com/apacific/yeodeun/blob/main/demo/home-en.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/home-kr.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/home-jp.jpg?raw=true" width="222">

### About Page              

<img src="https://github.com/apacific/yeodeun/blob/main/demo/about-en.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/about-kr.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/about-jp.jpg?raw=true" width="222">


<img src="https://github.com/apacific/yeodeun/blob/main/demo/about-2-en.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/about-2-kr.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/about-2-jp.jpg?raw=true" width="222">

### Image Gallery 

<img src="https://github.com/apacific/yeodeun/blob/main/demo/gall-en.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/gall-kr.jpg?raw=true" width="222">  |  <img src="https://github.com/apacific/yeodeun/blob/main/demo/gall-jp.jpg?raw=true" width="222">

- ASP.NET Core API + PostgreSQL
- Expo React Native mobile app
- English, Korean, and Japanese localization

## Repository Layout

- `services/api` - backend API, database, seed logic, tests
- `services/mobile` - Expo app, i18n resources, mobile tests

## Prerequisites

- Docker Desktop
- Node.js 20+
- .NET SDK 10 (for local API test runs)
- Expo Go (or emulator/simulator)

## Environment Variables

Set secrets in your shell or secret manager (do not commit real values):

```powershell
$env:USDA_FDC_API_KEY = "<your-usda-key>"
$env:ADMIN_JWT_KEY = "<strong-random-key>"
```

## Run with Docker

### Local development (recommended)

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

This enables development defaults, includes DB host port mapping, and supports local seed workflows.

### Non-local / stricter mode

```powershell
docker compose up --build
```

Base compose defaults to production-safe behavior.

## Mobile App

```powershell
cd services/mobile
npm install
npx expo start -c --lan
```

## Nutrition Data

- Nutrition profiles are sourced from USDA FoodData Central.
- Admin endpoints are under `api/admin/nutrition/*`.
- Admin endpoints require JWT Bearer auth with `role: Admin`.

### Generate a local admin JWT (PowerShell)

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
"$unsigned.$sig"
```

Use token:

```powershell
$token = "<paste-token>"
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Get `
  -Uri http://localhost:5010/api/admin/nutrition/audit `
  -Headers $headers
```

## Seed Behavior

- Seed upserts menu items by `(category, name)`.
- Items removed from seed are soft-disabled (not deleted), so old menu entries can be retired safely.

## Testing

### Backend
```powershell
cd /path/to/yeodeun
dotnet test services/api/Yeodeun.slnx -v minimal
dotnet test services/api/tests/Yeodeun.Api.IntegrationTests/Yeodeun.Api.IntegrationTests.csproj -v minimal --no-restore
dotnet test services/api/tests/Yeodeun.Api.EndToEndTests/Yeodeun.Api.EndToEndTests.csproj -v minimal --no-restore
```

### Mobile (unit/integration)

```powershell
cd services/mobile
npm test -- --runInBand --passWithNoTests --forceExit
npx tsc --noEmit
```

### Mobile e2e (Maestro)

```powershell
cd services/mobile
npm run test:e2e:maestro
```

## Security Notes

- `USDA_FDC_API_KEY` and `ADMIN_JWT_KEY` are kept out of source control.
- `ADMIN_JWT_KEY` is meant to be rotated regularly.
- Admin endpoint access is restricted via environment/network settings in API configuration.
