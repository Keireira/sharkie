# Sharkie

Currency exchange rates API with historical data from 2000 to present.

## API Reference

Base URL: `http://localhost:3000`

### Health Check

```
GET /health
```

Returns the server status.

**Response**

```json
{
  "status": "ok",
  "message": "Sharkie is running"
}
```

---

### Get Historical Rates

```
GET /history
```

Returns exchange rates for specified dates. Base currency is always **USD**.

**Query Parameters**

| Parameter    | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `date`       | string | Yes      | Comma-separated dates in `YYYY-MM-DD` format     |
| `currencies` | string | No       | Comma-separated currency codes (e.g., `EUR,KZT`) |

**Example Requests**

Single date, all currencies:

```
GET /history?date=2024-01-15
```

Multiple dates, specific currencies:

```
GET /history?date=2024-01-15,2024-01-16&currencies=EUR,RUB,KZT
```

**Success Response**

```json
{
  "base": "USD",
  "data": [
    {
      "date": "2024-01-15",
      "rates": {
        "RUB": 87.96,
        "KZT": 451.3394,
        "EUR": 0.913585
      }
    },
    {
      "date": "2024-01-16",
      "rates": {
        "EUR": 0.91928,
        "KZT": 453.1397,
        "RUB": 87.96
      }
    }
  ]
}
```

**Error Responses**

| Code | Description                                |
|------|--------------------------------------------|
| 400  | Invalid date format or empty parameters    |
| 404  | No data found for requested dates          |
| 413  | Response exceeds 512 KB limit              |
| 500  | Internal server error                      |

**Error Response Format**

```json
{
  "status": "error",
  "code": 400,
  "message": "Invalid date format: 'invalid'. Use YYYY-MM-DD"
}
```

## Running

### Environment Variables

| Variable           | Description                    |
|--------------------|--------------------------------|
| `DATABASE_URL`     | PostgreSQL connection string   |
| `CURRENCY_API_URL` | <https://currencyapi.net/api/v1/> |
| `CURRENCY_API_KEY` | currencyapi.net API key      |

### Docker

```bash
docker-compose up
```

### Local Development

```bash
cargo run
```

Server starts on `http://0.0.0.0:3000`

## Background Tasks

- **Startup**: checks for missing dates from 2000-01-01 to yesterday and backfills them from external API
- **Every 2 hours**: fetches today's exchange rates if not already present

## License

[AGPL-3.0](LICENSE)
