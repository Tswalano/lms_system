# Errors

The API uses standard HTTP status codes and a consistent error body.

## Error body

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

## Common status codes

| Code | Meaning |
|---|---|
| `400` | Bad request — invalid or missing fields |
| `401` | Unauthorized — missing or expired token |
| `403` | Forbidden — valid token but insufficient role |
| `404` | Not found — resource does not exist |
| `409` | Conflict — duplicate entry |
| `422` | Unprocessable entity — validation failed |
| `500` | Internal server error |

## Leave-specific errors

| Message | Cause |
|---|---|
| `End date cannot be before start date` | `leave_end` < `leave_start` |
| `Insufficient leave balance` | Not enough days remaining for the leave type |
| `Leave request already processed` | Trying to cancel an already-rejected request |
