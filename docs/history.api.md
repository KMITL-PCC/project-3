# History API Documentation

## Base URL

```
/history
```

---

## Authentication

All endpoints under `/history` are protected by `authMiddleware`.

Currently the middleware is a stub — it will be replaced with proper session-based authentication. Once implemented, the authenticated user's `StudentId` will be read directly from the session, so **no `studentId` parameter is needed in the request**.

| Role    | Access         |
|---------|----------------|
| `admin` | ✅ Allowed     |
| `user`  | ✅ Allowed     |
| `guest` | ❌ Forbidden   |

---

## Endpoints

### 1. Get My Check-in History

```
GET /history
```

Returns all check-in records belonging to the currently authenticated student. The student identity is resolved from the session — the caller does not pass a student ID explicitly.

> **Current stub behaviour:** `studentId` is hardcoded to `"64010002"` inside the controller until session authentication is implemented.

#### Parameters

None.

---

#### Responses

##### 200 OK

Returned when at least one check-in record is found for the authenticated student.

```json
{
  "success": true,
  "data": [
    {
      "status": "checked_out",
      "room_code": "A101",
      "student_id": "64010002",
      "user_name": "สมหญิง เกษมสุข"
    },
    {
      "status": "checked_in",
      "room_code": "C301",
      "student_id": "64010002",
      "user_name": "สมหญิง เกษมสุข"
    }
  ]
}
```

#### 💻 Frontend Usage
```ts
const getMyHistory = async () => {
  const res = await api.get('/history');
  return res.data.data;
};
```

---

##### Response Fields

**`data[]` object**

| Field        | Type   | Nullable | Description                                                                       |
|--------------|--------|----------|-----------------------------------------------------------------------------------|
| `status`     | string | No       | `"checked_out"` if `check_out` has a value, `"checked_in"` if `check_out` is null |
| `room_code`  | string | No       | Room code where the check-in occurred (e.g. `A101`)                               |
| `student_id` | string | No       | The student's ID (8 characters)                                                   |
| `user_name`  | string | No       | Concatenation of `fname` and `lname` (e.g. `"สมหญิง เกษมสุข"`)                  |

> **Note on `user_name`:** The value is built as `` `${fname} ${lname}` ``. If either field is `null` in the database the string will contain the literal word `"null"` (e.g. `"null เกษมสุข"`). This will be addressed when authentication and user profile completion are enforced.

> **Note on ordering:** Records are returned in **database insertion order** — no explicit sort is applied. Do not rely on any particular ordering of results.

> **Note on timestamps:** `check_in` and `check_out` are queried internally to derive `status` but are **not included in the response**. They will be added in a future update.

---

##### 403 Forbidden

Returned by `authMiddleware` when the user's role is `"guest"` or the session is invalid.

```json
{
  "success": false,
  "message": "Forbidden"
}
```

---

##### 404 Not Found

Returned when no check-in records exist for the authenticated student.

```json
{
  "success": false,
  "message": "No history found"
}
```

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

## Status Field Logic

`status` is derived entirely from the `check_out` column — no dedicated status column exists in the database.

| `check_out` value  | Returned `status` |
|--------------------|-------------------|
| Has a timestamp    | `"checked_out"`   |
| `null`             | `"checked_in"`    |

---

## Fields Queried but Not Returned

The service fetches the following columns from the database that are **not** exposed in the current response:

| Column      | Queried | Returned | Used for          |
|-------------|---------|----------|-------------------|
| `check_in`  | ✅      | ❌       | Nothing (unused)  |
| `check_out` | ✅      | ❌       | Deriving `status` |

---

## Planned Changes

| # | Change |
|---|--------|
| 1 | `studentId` will be extracted from the session instead of being hardcoded |
| 2 | `authMiddleware` will verify a signed JWT / session token |
| 3 | `check_in` and `check_out` timestamps will be included in the response |
| 4 | `user_name` null-safety will be handled (`fname ?? ""`) |
| 5 | Response will be sorted by `check_in` descending (most recent first) |
| 6 | Pagination support (`page`, `limit`) may be added |
| 7 | Date range filtering (`startDate`, `endDate`) may be added |