# Introduction

The **LMS Employee Management API** powers leave management, document signing, performance reviews, and notifications for the Disraptor LMS platform.

This API enables developers to integrate, automate, and extend workforce management capabilities across internal systems and external applications.

---

## Overview

The API is built around REST principles and provides predictable, resource-oriented endpoints. It is designed for reliability, clarity, and ease of integration.

---

## Base URLs

| Environment | URL                                                            |
| ----------- | -------------------------------------------------------------- |
| Production  | `https://9z3skhtfwi.execute-api.af-south-1.amazonaws.com/prod` |
| Development | `https://xrdpcrhluc.execute-api.af-south-1.amazonaws.com/dev`  |
| Local       | `http://localhost:3000`                                        |

All endpoints are relative to the selected environment base URL.

---

## Authentication

All requests must include a valid Bearer token.

```http id="auth01"
Authorization: Bearer YOUR_API_KEY
```

Requests without valid authentication will return a `401 Unauthorized` response.

---

## Quick Start

Example request to retrieve leave requests:

```bash id="qs01"
curl -X GET https://9z3skhtfwi.execute-api.af-south-1.amazonaws.com/prod/leave-requests \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Response Format

All endpoints return JSON using a consistent response envelope:

```json id="resp01"
{
  "success": true,
  "message": "Human-readable status",
  "data": {}
}
```

Error responses follow the same structure with:

* `"success": false`
* an appropriate HTTP status code

---

## Core Capabilities

### Leave Management

Create, update, and track employee leave requests.

### Document Signing

Handle document workflows and digital approvals.

### Performance Reviews

Manage employee evaluations and feedback cycles.

### Notifications

Trigger and manage system notifications and alerts.

---

## HTTP Methods

| Method | Description               |
| ------ | ------------------------- |
| GET    | Retrieve resources        |
| POST   | Create new resources      |
| PUT    | Update existing resources |
| DELETE | Remove resources          |

---

## Error Handling

The API uses standard HTTP status codes to indicate request outcomes.

| Code | Description  |
| ---- | ------------ |
| 200  | Success      |
| 400  | Bad request  |
| 401  | Unauthorized |
| 404  | Not found    |
| 500  | Server error |

Example error response:

```json id="err01"
{
  "success": false,
  "message": "Invalid API key",
  "data": null
}
```

---

## Next Steps

* Getting Started
* Authentication
* API Reference

---

## Notes

* All dates use ISO 8601 format (`YYYY-MM-DD`)
* All responses are returned in JSON
* Rate limiting may apply depending on environment

---

For support or access requests, contact your system administrator or the Disraptor team.
