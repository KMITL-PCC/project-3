# 📚 API Documentation — Project 3 (ฉบับสมบูรณ์)

> **Base URL:** `http://localhost:3000/api`
>
> **Authentication:** ใช้ **Session Cookie** (`connect.sid`) — ไม่ใช้ JWT
> ทุก request ที่ต้องการ auth ต้องส่ง cookie ไปด้วย (`withCredentials: true`)

---

## 🏗️ สถาปัตยกรรมโดยรวม

```
Frontend (React / Next.js / etc.)
   │
   │  HTTP Request + Session Cookie (connect.sid)
   ▼
Express Server (port 3000)
   ├── /api/auth/*       → Auth Controller     → Auth Service (DB lookup)
   ├── /api/qrcode/*     → QR Code Controller  → In-memory token + Prisma DB
   ├── /api/users/*      → Users Controller    → Users Service (🚧 TODO)
   ├── /api/rooms/*      → Rooms Controller    → Rooms Service (🚧 TODO)
   └── /api/dashboard    → Dashboard Controller→ Dashboard Service (DB query)
   │
   ├── Redis (ioredis)         ← เก็บ Session Data
   └── PostgreSQL (Prisma ORM) ← ข้อมูลหลักทั้งหมด
```

### Auth Flow (Login)
```
1. Frontend ส่ง POST /api/auth/login  { studentId, password }
2. Backend → Auth Service → ค้นหา User ใน PostgreSQL ด้วย StudentId
3. เปรียบเทียบ password (plain-text check ปัจจุบัน)
4. ถ้าตรง → สร้าง Session (เก็บใน Redis) → ส่ง Set-Cookie กลับ
5. ถ้าไม่ตรง → 401 Unauthorized
6. ทุก request หลังจากนี้ browser จะแนบ cookie อัตโนมัติ
```

### QR Code Check-in Flow
```
1. Booth (IoT Device)  → POST /api/qrcode/generate   → ได้ qr_token + scan_url
2. Booth แสดง QR บนจอ   → GET  /api/qrcode/poll/:id  → polling ดูว่ามีคนสแกนหรือยัง
3. นักศึกษาสแกน QR      → POST /api/qrcode/scan      → ได้ข้อมูลห้อง + recommended action
4. นักศึกษากดยืนยัน      → POST /api/qrcode/action    → CHECK_IN / CHECK_OUT / SWAP
5. Booth เห็น used=true  → generate QR ใหม่
```

---

## 🗄️ Database Schema (Prisma)

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Checkin : has
    User }o--|| Role : belongs_to
    User }o--|| major : belongs_to
    Room ||--o{ Checkin : has
    Room }o--|| Building : in
    Room ||--o| Device : has
    Room ||--o{ ClassSession : hosts
    Device }o--o| Zone : in
    Device }o--o| Ad : displays
    Device ||--o{ ClassSession : runs
    Device }o--o{ Activity : has
    Ad ||--o{ Activity : promotes
    QrCode ||--o{ Activity : linked
```

### Models สรุป

| Model | Primary Key | คำอธิบาย |
|-------|-------------|----------|
| `User` | `id` (auto-increment) | ผู้ใช้ระบบ (นักศึกษา/อาจารย์/แอดมิน) |
| `Role` | `id` / `roleId` (unique) | บทบาท เช่น STUDENT, TEACHER, ADMIN |
| `major` | `id` / `majorId` (unique) | สาขาวิชา |
| `Building` | `buildingCode` | อาคาร |
| `Room` | `roomCode` | ห้องเรียน (อยู่ใน Building) |
| `Device` | `id` (uuid) | อุปกรณ์ IoT (ผูกกับ Room 1:1) |
| `Zone` | `id` (uuid) | กลุ่มอุปกรณ์ |
| `Ad` | `id` (uuid) | สื่อโฆษณา (IMAGE/VIDEO) |
| `Activity` | `id` (uuid) | กิจกรรม (ผูกกับ Device, Ad, QrCode) |
| `QrCode` | `id` (uuid) | QR Code ที่บันทึกในระบบ |
| `ClassSession` | `id` (auto-increment) | คาบเรียน |
| `Checkin` | `id` (auto-increment) | บันทึกการเช็คอิน/เช็คเอาท์ |
| `AuditLog` | `id` (auto-increment) | Log การเปลี่ยนแปลง |

### User Model (รายละเอียด)
```prisma
model User {
  id        Int      @id @default(autoincrement())
  StudentId String?  @unique @db.VarChar(8)    // รหัสนักศึกษา 8 หลัก
  prefix    String?  @db.VarChar(20)           // คำนำหน้า
  fname     String?  @db.VarChar(50)           // ชื่อจริง
  lname     String?  @db.VarChar(50)           // นามสกุล
  nickname  String?  @db.VarChar(50)           // ชื่อเล่น
  password  String   @default("1234")          // รหัสผ่าน
  roleId    String?  @db.VarChar(20)           // FK → Role
  img       String?  @db.Text                  // URL รูปโปรไฟล์
  phone     String?  @db.VarChar(15)           // เบอร์โทร
  email     String?  @db.VarChar(100)          // อีเมล
  gen       String?  @db.VarChar(10)           // รุ่น
  majorId   String?  @db.VarChar(20)           // FK → major
  createdAt DateTime @default(now())
}
```

### Room Model
```prisma
model Room {
  roomCode     String  @id          // เช่น "HM305"
  buildingCode String?              // FK → Building
  roomFloor    String?              // ชั้น
  roomCapacity String?              // ความจุ
  roomDesc     String?              // รายละเอียดห้อง
}
```

### Checkin Model
```prisma
model Checkin {
  id        Int       @id @default(autoincrement())
  StudentId String                  // FK → User.StudentId
  roomCode  String                  // FK → Room.roomCode
  checkIn   DateTime?               // เวลาเช็คอิน
  checkOut  DateTime?               // เวลาเช็คเอาท์ (null = ยังอยู่)
}
```

---

## 🔐 Auth Endpoints

### `POST /api/auth/login`

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

**Response `400 Bad Request`:**
```json
{ "message": "Student ID and password are required" }
```

**Response `401 Unauthorized`:**
```json
{ "message": "Invalid credentials (User not found)" }
```
หรือ
```json
{ "message": "Invalid credentials" }
```

**Session Data ที่ถูกเก็บ (Redis):**
| Key | ค่า | คำอธิบาย |
|-----|------|----------|
| `userId` | `1` | ID ของ user ในฐานข้อมูล |
| `studentId` | `"65015234"` | รหัสนักศึกษา |
| `role` | `"STUDENT"` | ชื่อ role |
| `roleId` | `"student"` | role ID |
| `fname` | `"สมชาย"` | ชื่อจริง |
| `lname` | `"ใจดี"` | นามสกุล |

---

### `POST /api/auth/logout`

ลบ session ออกจาก Redis และล้าง cookie `connect.sid`

**Request:** ไม่ต้องส่ง body (ต้องมี session cookie)

**Response `200 OK`:**
```json
{ "message": "Logout successful" }
```

**Response `500 Internal Server Error`:**
```json
{ "message": "Logout failed" }
```

---

### `GET /api/auth/me`

ดึงข้อมูล user ของ session ปัจจุบัน (query จาก DB ไม่ใช่แค่ session)

**Request:** ไม่ต้องส่ง body (ต้องมี session cookie)

**Response `200 OK`:**
```json
{
  "user": {
    "id": 1,
    "StudentId": "65015234",
    "fname": "สมชาย",
    "lname": "ใจดี",
    "nickname": "เจมส์",
    "roleId": "student",
    "role": { "name": "STUDENT" },
    "majorId": "cpe",
    "major": { "name": "วิศวกรรมคอมพิวเตอร์" },
    "img": "https://example.com/profile.jpg",
    "phone": "0812345678",
    "email": "somchai@example.com",
    "gen": "28"
  }
}
```

**Response `401 Unauthorized`:**
```json
{ "message": "Unauthorized: No active session" }
```
หรือ
```json
{ "message": "User not found" }
```

---

### `POST /api/auth/student-check`

เช็คว่านักศึกษามีอยู่ในระบบหรือไม่ (ใช้ในหน้า /scan ก่อน check-in)

**Request Body:**
```json
{
  "studentId": "65015234"
}
```

**Response `200 OK` (พบ):**
```json
{
  "exists": true,
  "student": {
    "id": 1,
    "StudentId": "65015234",
    "prefix": "นาย",
    "fname": "สมชาย",
    "lname": "ใจดี",
    "nickname": "เจมส์",
    "majorId": "cpe",
    "major": { "name": "วิศวกรรมคอมพิวเตอร์" },
    "gen": "28"
  }
}
```

**Response `404 Not Found` (ไม่พบ):**
```json
{
  "exists": false,
  "message": "Student not found. You can proceed as Guest."
}
```

**Response `400 Bad Request`:**
```json
{ "error": "studentId is required" }
```

---

### `POST /api/auth/register`

> ⚠️ **ไม่รองรับ** — ระบบใช้ Auto-register ตอนสแกน QR (upsert ใน `/qrcode/action`)

**Response `400`:**
```json
{ "message": "Please use login endpoint (Auto-register logic applied)" }
```

---

### `POST /api/auth/refresh`

> 🚧 **Placeholder** — ยังไม่ได้ implement

**Response `200`:**
```json
{ "message": "Not implemented yet" }
```

---

## 📷 QR Code Endpoints

> **หมายเหตุ:** Token ถูกเก็บใน **memory** (Map) ไม่ใช่ database — จะหายเมื่อ server restart

### `POST /api/qrcode/generate`

สร้าง QR Token ใหม่สำหรับ class session (เรียกจาก Booth/อุปกรณ์ IoT)

**Request Body:**
```json
{
  "class_session_id": 1,
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `class_session_id` | `number` | ✅ | ID ของ ClassSession |
| `macAddress` | `string` | ❌ | MAC Address ของอุปกรณ์ (ใช้ดึงข้อมูลห้อง) |

**Response `200 OK`:**
```json
{
  "message": "QR Token generated successfully",
  "qr_token": "a1b2c3d4e5f67890",
  "scan_url": "http://localhost:3000/scan?token=a1b2c3d4e5f67890",
  "expires_in": 300,
  "metadata": {
    "subject_id": 1,
    "roomCode": "HM305",
    "roomDesc": "ห้องปฏิบัติการคอมพิวเตอร์"
  }
}
```

**Response `400 Bad Request`:**
```json
{ "error": "class_session_id is required" }
```

**Response `404 Not Found`:**
```json
{ "error": "Class session not found" }
```

**พฤติกรรมสำคัญ:**
- Token หมดอายุใน **5 นาที** (`QR_VALIDITY_MS = 300000ms`)
- Booth ควร generate ใหม่ทุก **30 วินาที** (`QR_RENEWAL_THRESHOLD_MS`)
- Token เก่าจะถูก cleanup อัตโนมัติเมื่อ generate ใหม่
- `scan_url` ใช้ `FRONTEND_URL` env หรือ fallback เป็น `http://{hostname}:3000`

---

### `POST /api/qrcode/scan`

สแกน QR Token — ระบบจะ "Discovery" ว่านักศึกษาควรทำ action อะไร

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f67890",
  "studentId": "65015234"
}
```

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `token` | `string` | ✅ | QR Token ที่ได้จากการสแกน |
| `studentId` | `string` | ✅ | รหัสนักศึกษา |

**Response `200 OK`:**
```json
{
  "success": true,
  "action": "CHECK_IN",
  "currentSession": null,
  "metadata": {
    "class_session_id": 1,
    "subject_id": 1,
    "startTime": "2026-03-12T08:00:00.000Z",
    "endTime": "2026-03-12T11:00:00.000Z",
    "roomCode": "HM305",
    "roomDesc": "ห้องปฏิบัติการคอมพิวเตอร์",
    "studentName": "สมชาย ใจดี"
  }
}
```

**Recommended Action Logic:**

| สถานะปัจจุบัน | Action ที่แนะนำ | คำอธิบาย |
|---------------|-----------------|----------|
| ยังไม่ได้เช็คอินที่ไหนเลย | `CHECK_IN` | เช็คอินเข้าห้องนี้ |
| เช็คอินอยู่ห้อง**เดียวกัน** | `CHECK_OUT` | เช็คเอาท์ออกจากห้อง |
| เช็คอินอยู่ห้อง**อื่น** | `SWAP` | เช็คเอาท์ห้องเดิม + เช็คอินห้องใหม่ |

**เมื่อ action = `CHECK_OUT` หรือ `SWAP`** จะมี `currentSession` data:
```json
{
  "currentSession": {
    "id": 5,
    "StudentId": "65015234",
    "roomCode": "HM301",
    "checkIn": "2026-03-12T08:30:00.000Z",
    "checkOut": null
  }
}
```

**Response `400 Bad Request`:**
```json
{ "error": "Token and studentId are required" }
```

**Response `404 Not Found`:**
```json
{ "error": "Invalid or expired token" }
```

**Response `410 Gone`:**
```json
{ "error": "Token has expired" }
```

---

### `GET /api/qrcode/poll/:class_session_id`

Booth polling — เช็คว่า QR Token ปัจจุบันถูกใช้(สแกน)หรือยัง

**Path Parameters:**
| Parameter | คำอธิบาย |
|-----------|----------|
| `class_session_id` | ID ของ ClassSession |

**Response `200 OK` (ยังไม่ถูกสแกน):**
```json
{ "used": false }
```

**Response `200 OK` (ถูกสแกนแล้ว → ควร generate ใหม่):**
```json
{ "used": true }
```

**Response `200 OK` (ยังไม่เคย generate):**
```json
{ "used": true, "reason": "uninitialized" }
```

---

### `POST /api/qrcode/action`

ยืนยัน action หลังจากสแกน QR — ทำ CHECK_IN / CHECK_OUT / SWAP จริง

**Request Body:**
```json
{
  "action": "CHECK_IN",
  "studentId": "65015234",
  "token": "a1b2c3d4e5f67890",
  "isGuest": false
}
```

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `action` | `string` | ✅ | `"CHECK_IN"` / `"CHECK_OUT"` / `"SWAP"` |
| `studentId` | `string` | ✅ | รหัสนักศึกษา |
| `token` | `string` | ✅ | QR Token เดิมที่สแกนมา |
| `isGuest` | `boolean` | ❌ | ถ้า `true` จะสร้าง user ชื่อ "Guest User" |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "CHECK_IN completed successfully",
  "action": "CHECK_IN"
}
```

**Response `400 Bad Request`:**
```json
{ "error": "Action, studentId, and token are required" }
```

**Response `404 Not Found`:**
```json
{ "error": "Token expired or invalid. Please scan again." }
```

**พฤติกรรมแต่ละ Action:**

| Action | สิ่งที่เกิดขึ้น |
|--------|----------------|
| `CHECK_IN` | สร้าง Checkin record ใหม่ (checkOut = null) |
| `CHECK_OUT` | อัพเดท checkOut เป็น `now()` สำหรับ record ที่ match roomCode |
| `SWAP` | เช็คเอาท์ทุก active checkin ที่มี → สร้าง Checkin record ใหม่สำหรับห้องปัจจุบัน |

> **หมายเหตุ:** Action นี้จะ **upsert User** อัตโนมัติ — ถ้า studentId ยังไม่มีในระบบจะสร้างใหม่
> และจะบันทึก **AuditLog** ทุกครั้ง

---

## 📊 Dashboard Endpoint

### `GET /api/dashboard`

> 🚧 **อยู่ระหว่างพัฒนา** — ปัจจุบันคืน user ทั้งหมด (ยังไม่ใช่ stats จริง)

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "StudentId": "65015234",
    "fname": "สมชาย",
    "lname": "ใจดี",
    ...
  }
]
```

---

## 👥 Users Endpoints

> 🚧 **TODO** — Route ถูก define ไว้แล้ว แต่ service logic ยังไม่ได้ implement (คืน `undefined`)

| Method | Path | คำอธิบาย | สถานะ |
|--------|------|----------|-------|
| `GET` | `/api/users` | ดู user ทั้งหมด | 🚧 TODO |
| `GET` | `/api/users/:id` | ดู user ตาม ID | 🚧 TODO |
| `POST` | `/api/users` | สร้าง user ใหม่ | 🚧 TODO |
| `PUT` | `/api/users/:id` | แก้ไข user | 🚧 TODO |
| `DELETE` | `/api/users/:id` | ลบ user | 🚧 TODO |

---

## 🏫 Rooms Endpoints

> 🚧 **TODO** — Route ถูก define ไว้แล้ว แต่ service logic ยังไม่ได้ implement (คืน `undefined`)

| Method | Path | คำอธิบาย | สถานะ |
|--------|------|----------|-------|
| `GET` | `/api/rooms` | ดูห้องทั้งหมด | 🚧 TODO |
| `GET` | `/api/rooms/:id` | ดูห้องตาม ID | 🚧 TODO |
| `POST` | `/api/rooms` | เพิ่มห้องใหม่ | 🚧 TODO |
| `PUT` | `/api/rooms/:id` | แก้ไขห้อง | 🚧 TODO |
| `DELETE` | `/api/rooms/:id` | ลบห้อง | 🚧 TODO |

---

## 💻 วิธีเรียก API จาก Frontend

### 1. ติดตั้ง Axios

```bash
npm install axios
```

### 2. ตั้งค่า Axios Instance

```ts
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // ⚠️ สำคัญมาก! ต้องใส่เพื่อส่ง session cookie
});

export default api;
```

> [!CAUTION]
> **ห้ามลืม `withCredentials: true`** — ถ้าไม่ใส่ browser จะไม่ส่ง cookie ทำให้ auth ไม่ทำงาน

### 3. ตัวอย่าง Login

```ts
import api from './lib/api';

async function login(studentId: string, password: string) {
  try {
    const res = await api.post('/auth/login', { studentId, password });
    console.log('Logged in:', res.data.user);
    return res.data.user;
    // { id, studentId, fname, lname, role, roleId, major }
  } catch (err: any) {
    console.error('Login failed:', err.response?.data?.message);
    throw err;
  }
}
```

### 4. ตัวอย่าง ดูข้อมูลตัวเอง

```ts
async function getMe() {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
    // { id, StudentId, fname, lname, nickname, roleId, role, majorId, major, img, phone, email, gen }
  } catch (err) {
    // ไม่มี session หรือ session หมดอายุ
    return null;
  }
}
```

### 5. ตัวอย่าง Logout

```ts
async function logout() {
  await api.post('/auth/logout');
  // cookie ถูกล้างอัตโนมัติ → redirect ไปหน้า login
  window.location.href = '/login';
}
```

### 6. ตัวอย่าง Student Check (หน้าสแกน)

```ts
async function checkStudent(studentId: string) {
  const res = await api.post('/auth/student-check', { studentId });
  if (res.data.exists) {
    console.log('พบนักศึกษา:', res.data.student);
    return res.data.student;
  } else {
    console.log('ไม่พบ → ดำเนินการเป็น Guest');
    return null;
  }
}
```

### 7. ตัวอย่าง QR Code Flow (Booth)

```ts
// === ฝั่ง Booth (IoT Device / อาจารย์) ===

// สร้าง QR Token
async function generateQR(classSessionId: number, macAddress?: string) {
  const res = await api.post('/qrcode/generate', {
    class_session_id: classSessionId,
    macAddress,
  });
  return res.data;
  // { qr_token, scan_url, expires_in, metadata }
}

// Polling ว่า QR ถูกสแกนหรือยัง (เรียกทุก 2-3 วินาที)
async function pollQR(classSessionId: number) {
  const res = await api.get(`/qrcode/poll/${classSessionId}`);
  return res.data.used; // true = ถูกสแกนแล้ว → ควร generate ใหม่
}

// ตัวอย่าง Booth Loop
async function boothLoop(classSessionId: number, mac: string) {
  let qrData = await generateQR(classSessionId, mac);
  displayQR(qrData.scan_url); // แสดง QR บนจอ

  setInterval(async () => {
    const used = await pollQR(classSessionId);
    if (used) {
      qrData = await generateQR(classSessionId, mac);
      displayQR(qrData.scan_url);
    }
  }, 3000); // poll ทุก 3 วินาที
}
```

### 8. ตัวอย่าง QR Code Flow (นักศึกษา)

```ts
// === ฝั่งนักศึกษา (หน้า /scan) ===

// Step 1: สแกน QR → ดึง token จาก URL params
const token = new URLSearchParams(window.location.search).get('token');

// Step 2: ส่ง token + studentId ไป discover
async function scanQR(token: string, studentId: string) {
  const res = await api.post('/qrcode/scan', { token, studentId });
  return res.data;
  // { success, action: "CHECK_IN"|"CHECK_OUT"|"SWAP", currentSession, metadata }
}

// Step 3: แสดงข้อมูล + ให้กดยืนยัน
// เช่น "คุณกำลังจะ CHECK_IN ที่ห้อง HM305"

// Step 4: ยืนยัน action
async function confirmAction(action: string, studentId: string, token: string, isGuest = false) {
  const res = await api.post('/qrcode/action', {
    action,
    studentId,
    token,
    isGuest,
  });
  return res.data;
  // { success: true, message: "CHECK_IN completed successfully", action }
}
```

### 9. React Hook: `useAuth`

```tsx
import { useState, useEffect } from 'react';
import api from './lib/api';

interface User {
  id: number;
  StudentId: string;
  fname: string;
  lname: string;
  nickname?: string;
  roleId?: string;
  role?: { name: string };
  majorId?: string;
  major?: { name: string };
  img?: string;
  phone?: string;
  email?: string;
  gen?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (studentId: string, password: string) => {
    const res = await api.post('/auth/login', { studentId, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
```

### 10. React Hook: `useQRCheckin`

```tsx
import { useState } from 'react';
import api from './lib/api';

interface ScanResult {
  success: boolean;
  action: 'CHECK_IN' | 'CHECK_OUT' | 'SWAP';
  currentSession: any;
  metadata: {
    class_session_id: number;
    subject_id: number;
    startTime: string;
    endTime: string;
    roomCode: string;
    roomDesc: string;
    studentName: string;
  };
}

export function useQRCheckin() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (token: string, studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/qrcode/scan', { token, studentId });
      setScanResult(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Scan failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (action: string, studentId: string, token: string, isGuest = false) => {
    setLoading(true);
    try {
      const res = await api.post('/qrcode/action', { action, studentId, token, isGuest });
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { scanResult, loading, error, scan, confirm };
}
```

---

## ⚙️ Environment Variables

| Variable | ค่าตัวอย่าง | Required | คำอธิบาย |
|----------|-------------|----------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | ❌ | Redis URL (default: `redis://localhost:6379`) |
| `SESSION_SECRET` | `my_super_secret_key` | ✅ | Secret สำหรับ sign session cookie |
| `PORT` | `3000` | ❌ | Port ของ Express server (default: `3000`) |
| `NODE_ENV` | `production` | ❌ | Environment mode |
| `COOKIE_DOMAIN` | `.example.com` | ❌ | Cookie domain (prod, สำหรับ subdomain sharing) |
| `COOKIE_SECURE` | `true` | ❌ | HTTPS-only cookie (auto `true` ใน prod) |
| `COOKIE_SAMESITE` | `lax` | ❌ | SameSite policy: `lax`, `strict`, `none` |
| `SESSION_MAX_AGE_DAYS` | `30` | ❌ | Session cookie อายุกี่วัน (default: `30`) |
| `FRONTEND_URL` | `https://app.example.com` | ❌ | URL ที่ใช้สร้าง scan_url ใน QR Code |

### Session Cookie Configuration

| Setting | Development | Production |
|---------|------------|------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `lax` | `lax` (หรือ `none` ถ้า cross-origin) |
| `domain` | `undefined` | `.example.com` |
| `maxAge` | 30 days | 30 days (configurable) |

---

## 🔧 Prisma Commands

```bash
# Generate Prisma client หลังแก้ schema
npx prisma generate

# สร้าง migration ใหม่
npx prisma migrate dev --name <ชื่อ_migration>

# Apply migration บน production
npx prisma migrate deploy

# ดู DB ผ่าน Prisma Studio (GUI)
npx prisma studio

# Seed ข้อมูลเริ่มต้น
npx prisma db seed

# Reset DB ทั้งหมด (⚠️ ลบข้อมูลทั้งหมด)
npx prisma migrate reset
```

---

## 🐳 Docker

### docker-compose.yml

```yaml
services:
  backend:        # Express App
    ports: ${PORT}
    depends_on: redis
    env: DATABASE_URL, REDIS_URL, SESSION_SECRET, PORT

  redis:          # Redis 7 Alpine
    ports: 6379
    volumes: redis_data:/data
```

### Commands

```bash
# เริ่ม project
docker compose up -d

# ดู logs
docker compose logs -f backend

# หยุด
docker compose down

# Rebuild หลังแก้โค้ด
docker compose up -d --build
```

---

## 📋 API Status Summary

| Module | Endpoints | สถานะ |
|--------|-----------|-------|
| 🔐 Auth | `login`, `logout`, `me`, `student-check` | ✅ **ใช้งานได้** |
| 📷 QR Code | `generate`, `scan`, `poll`, `action` | ✅ **ใช้งานได้** |
| 📊 Dashboard | `GET /dashboard` | ⚠️ **ใช้ได้ (แต่คืนแค่ user list)** |
| 👥 Users | CRUD 5 endpoints | 🚧 **Route มีแล้ว, Service ยัง TODO** |
| 🏫 Rooms | CRUD 5 endpoints | 🚧 **Route มีแล้ว, Service ยัง TODO** |

---

## ⚠️ ข้อควรระวังสำหรับ Frontend Developer

1. **`withCredentials: true`** — ลืมใส่ = session cookie ไม่ถูกส่ง = ทุก request จะ 401
2. **CORS** — Backend ต้อง allow origin ของ Frontend + `credentials: true` (ยังไม่มี CORS middleware)
3. **QR Token อยู่ใน Memory** — ถ้า server restart token จะหายหมด
4. **QR Token หมดอายุ 5 นาที** — Frontend ต้อง handle กรณี token expired
5. **Password เป็น Plain Text** — ปัจจุบันยังไม่มี hashing (dev mode)
6. **Users/Rooms Service ยังไม่ implement** — เรียก API จะได้ response เป็น `undefined`
7. **`/auth/me` query จาก DB** — ข้อมูลจะ fresh เสมอ ไม่ใช่แค่ session cache
8. **Student Check** — ใช้ก่อน QR action เพื่อเช็คว่ามี user ในระบบหรือต้องเป็น Guest
