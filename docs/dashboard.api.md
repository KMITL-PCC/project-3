# Dashboard API Documentation

## Base URL

```
/dashboard
```

---

## Authentication

The `/dashboard` route does **not** require authentication. All endpoints are publicly accessible.

---

## Endpoints

### 1. Health Check

```
GET /dashboard
```

Returns a simple status message confirming the dashboard route is reachable.

#### Response

**200 OK**
```
Dashboard Route
```

#### 💻 Frontend Usage
```ts
const checkHealth = async () => {
  const res = await api.get('/dashboard');
  console.log(res.data);
};
```

---

### 2. Get Attendance by Room Code

```
GET /dashboard/:roomCode
```

Returns a paginated list of check-in records for a specific room on a given date. Supports searching by student ID or name.

#### Path Parameters

| Parameter  | Type   | Required | Description                        |
|------------|--------|----------|------------------------------------|
| `roomCode` | string | ✅ Yes   | The unique room code (e.g. `A101`) |

#### Query Parameters

| Parameter | Type   | Required | Default      | Description                                                                          |
|-----------|--------|----------|--------------|--------------------------------------------------------------------------------------|
| `date`    | string | ❌ No    | Today's date | Target date in ISO 8601 format (e.g. `2025-01-15`)                                  |
| `search`  | string | ❌ No    | —            | Search keyword matched against `student_id`, `fname`, or `lname` (partial, case-insensitive) |
| `page`    | number | ❌ No    | `1`          | Page number for pagination                                                           |
| `limit`   | number | ❌ No    | `10`         | Number of records per page                                                           |

#### Example Requests

```
GET /dashboard/A101
GET /dashboard/A101?date=2025-01-15
GET /dashboard/A101?date=2025-01-15&search=64010001
GET /dashboard/A101?date=2025-01-15&search=สมชาย
GET /dashboard/A101?date=2025-01-15&page=2&limit=5
GET /dashboard/A101?date=2025-01-15&search=วงศ์&page=1&limit=20
```

---

#### Responses

##### 200 OK

Returned when at least one attendance record is found.

```json
{
  "success": true,
  "data": [
    {
      "studentId": "64010001",
      "user_name": "สมชาย วงศ์ดี",
      "checkinTime": "2025-01-15T07:03:00.000Z",
      "checkoutTime": "2025-01-15T08:58:00.000Z"
    },
    {
      "studentId": "64010002",
      "user_name": "สมหญิง เกษมสุข",
      "checkinTime": "2025-01-15T07:10:00.000Z",
      "checkoutTime": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "perPage": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 💻 Frontend Usage
```ts
const getAttendance = async (roomCode, date, page = 1) => {
  const res = await api.get(`/dashboard/${roomCode}`, {
    params: { date, page, limit: 10 }
  });
  return res.data; // { success, data, pagination }
};
```

##### Response Fields

**`data[]` object**

| Field          | Type           | Nullable | Description                                                        |
|----------------|----------------|----------|--------------------------------------------------------------------|
| `studentId`    | string         | No       | The student's ID (8 characters)                                    |
| `user_name`    | string         | No       | Concatenation of `fname` and `lname` (e.g. `"สมชาย วงศ์ดี"`)     |
| `checkinTime`  | string         | Yes      | Check-in timestamp in ISO 8601 format                              |
| `checkoutTime` | string         | Yes      | Check-out timestamp in ISO 8601 format, `null` if not checked out  |

> **Note on `user_name`:** The value is built as `` `${fname} ${lname}` ``. If either field is `null` in the database the string will contain the literal word `"null"` (e.g. `"null วงศ์ดี"`). This will be addressed when user profile completion is enforced.

> **Note on ordering:** Records are returned in **database insertion order** — no explicit sort is applied. Do not rely on any particular ordering of results.

**`pagination` object**

| Field         | Type   | Description                      |
|---------------|--------|----------------------------------|
| `currentPage` | number | The current page number          |
| `perPage`     | number | Number of records per page       |
| `total`       | number | Total number of matching records |
| `totalPages`  | number | Total number of pages            |

---

##### 400 Bad Request

Returned when the request parameters fail validation.

```json
{
  "success": false,
  "message": "Bad request"
}
```

Common causes:
- `roomCode` is missing or empty
- `date` is not a valid date string
- `page` or `limit` is not a number

---

##### 404 Not Found

Returned when no attendance records match the given filters.

```json
{
  "success": false,
  "message": "No attendances found"
}
```

> **Note:** A `404` is also returned when `page` exceeds the total number of pages, since the result set will be empty.

---

##### 500 Internal Server Error

Returned when an unexpected server-side error occurs.

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Search Behavior

The `search` query parameter performs a **partial, case-insensitive** match across three fields simultaneously using an `OR` condition:

| Field        | Example input | Matches                       |
|--------------|---------------|-------------------------------|
| `student_id` | `6401`        | `64010001`, `64010002`, ...   |
| `fname`      | `สม`          | `สมชาย`, `สมหญิง`, ...       |
| `lname`      | `วงศ์`        | `วงศ์ดี`, `วงศ์สกุล`, ...    |

A record is returned if **any** of the three fields contains the search term. When `search` is omitted, no text filter is applied and all records for the room and date are returned.

---

## Pagination

All list responses are paginated. Use `page` and `limit` to navigate:

```
GET /dashboard/A101?date=2025-01-15&page=1&limit=10   → records 1–10
GET /dashboard/A101?date=2025-01-15&page=2&limit=10   → records 11–20
GET /dashboard/A101?date=2025-01-15&page=3&limit=10   → records 21–30
```

---

## Notes

- All timestamps are returned in **UTC** (ISO 8601 format).
- The `date` parameter filters records where `check_in` falls within `00:00:00.000Z` – `23:59:59.999Z` of the given day in UTC. If the server timezone differs from the client, the effective day boundary may not match local midnight.
- `checkinTime` and `checkoutTime` may be `null` if the corresponding database column has not been set.
- `fname` and `lname` are individually `null`-safe at the database level but are concatenated without null guards in the current implementation (see `user_name` note above).