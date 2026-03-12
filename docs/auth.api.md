# 🔐 Auth Endpoints

> **Base URL:** `/api/auth`

## Endpoints

### 1. Login
`POST /auth/login`

ล็อกอินด้วย studentId + password — ถ้าผ่านจะสร้าง session cookie อัตโนมัติ

**Request Body:**
```json
{
  "studentId": "65015234",
  "password": "1234"
}
```

**Response `200 OK`:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "studentId": "65015234",
    "fname": "สมชาย",
    "lname": "ใจดี",
    "role": "STUDENT",
    "roleId": "student",
    "major": "วิศวกรรมคอมพิวเตอร์"
  }
}
```

**Response `401 Unauthorized`:**
```json
{ "message": "Invalid credentials" }
```

#### 💻 Frontend Usage
```ts
const handleLogin = async (studentId, password) => {
  try {
    const res = await api.post('/auth/login', { studentId, password });
    console.log('Login success:', res.data.user);
  } catch (err) {
    console.error('Login failed:', err.response?.data?.message);
  }
};
```

---

### 2. Logout
`POST /auth/logout`

ลบ session ออกจาก Redis และล้าง cookie `connect.sid`

**Response `200 OK`:**
```json
{ "message": "Logout successful" }
```

#### 💻 Frontend Usage
```ts
const handleLogout = async () => {
  await api.post('/auth/logout');
  window.location.href = '/login';
};
```

---

### 3. Get Current User (Me)
`GET /auth/me`

ดึงข้อมูล user ของ session ปัจจุบัน

**Response `200 OK`:**
```json
{
  "user": {
    "id": 1,
    "StudentId": "65015234",
    "fname": "สมชาย",
    ...
  }
}
```

#### 💻 Frontend Usage
```ts
const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data.user;
};
```

---

### 4. Student Check (Pre-scan)
`POST /auth/student-check`

เช็คว่านักศึกษามีอยู่ในระบบหรือไม่ (ใช้ก่อนเช็คอิน)

**Request Body:**
```json
{ "studentId": "65015234" }
```

**Response `200 OK`:**
```json
{ "exists": true, "student": { ... } }
```

#### 💻 Frontend Usage
```ts
const checkStudent = async (studentId) => {
  const res = await api.post('/auth/student-check', { studentId });
  if (res.data.exists) {
    return res.data.student;
  }
  return null;
};
```

---

### 5. Other Endpoints (WIP)
- `POST /auth/register`: ⚠️ ไม่รองรับโดยตรง (ใช้ Auto-register ผ่าน QR Action)
- `POST /auth/refresh`: 🚧 Placeholder
