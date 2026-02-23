# build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Yeodeun.Domain/Yeodeun.Domain.csproj src/Yeodeun.Domain/
COPY src/Yeodeun.Application/Yeodeun.Application.csproj src/Yeodeun.Application/
COPY src/Yeodeun.Infrastructure/Yeodeun.Infrastructure.csproj src/Yeodeun.Infrastructure/
COPY src/Yeodeun.Api/Yeodeun.Api.csproj src/Yeodeun.Api/
RUN dotnet restore src/Yeodeun.Api/Yeodeun.Api.csproj
COPY src/ src/
RUN dotnet publish src/Yeodeun.Api/Yeodeun.Api.csproj -c Release -o /app/publish

# runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Yeodeun.Api.dll"]

