# 📚 API Documentation — Project 3

> **Base URL:** `http://localhost:3000/api`
>
> **Auth:** ใช้ **Session Cookie** (`connect.sid`) — ไม่ใช้ JWT
> ทุก request ที่ต้องการ auth ต้องส่ง cookie ไปด้วย (ตั้ง `withCredentials: true`)

---

## 🏗️ สถาปัตยกรรมโดยรวม

```
Frontend
   │
   │  HTTP + Session Cookie
   ▼
Express Server (port 3000)
   │
   ├── RADIUS Server  ← ตรวจสอบ username/password
   ├── Redis          ← เก็บ session
   └── PostgreSQL     ← ข้อมูลหลัก (ผ่าน Prisma ORM)
```

### Auth Flow (Login)
```
1. Frontend ส่ง studentId + password
2. Backend → ส่งไปตรวจที่ RADIUS Server (UDP:1812)
3. RADIUS ตอบ Access-Accept → ผ่าน / Access-Reject → หยุด
4. Backend Upsert User ใน PostgreSQL
5. บันทึก session → Redis
6. ส่ง cookie กลับ Frontend
```

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id          Int    @id @default(autoincrement())
  username    String @unique   // รหัสนักศึกษา
  password    String           // เก็บว่าง "" (RADIUS จัดการ)
  role        Role   @default(STUDENT)
  attendances Attendance[]
}

model Subject {
  id       Int            @id @default(autoincrement())
  name     String
  period   String?
  sessions ClassSession[]
}

model Room {
  id       Int          @id @default(autoincrement())
  roomName String
  devices  DeviceIoT[]
  sessions ClassSession[]
}

model DeviceIoT {
  id         Int    @id @default(autoincrement())
  roomId     Int
  deviceName String?
  room       Room         @relation(...)
  sessions   ClassSession[]
}

model ClassSession {
  id        Int      @id @default(autoincrement())
  subjectId Int
  roomId    Int
  deviceId  Int
  qrToken   String   @unique   // QR Code token
  startTime DateTime
  endTime   DateTime
  subject   Subject    @relation(...)
  room      Room       @relation(...)
  device    DeviceIoT  @relation(...)
  attendances Attendance[]
}

model Attendance {
  id             Int      @id @default(autoincrement())
  userId         Int
  classSessionId Int
  checkinTime    DateTime
  status         String?          // เช่น "present", "late"
  user           User         @relation(...)
  classSession   ClassSession @relation(...)

  @@unique([userId, classSessionId])  // เช็คชื่อซ้ำไม่ได้
}

enum Role { STUDENT | TEACHER | ADMIN }
```

---

## 🔐 Auth Endpoints

### `POST /api/auth/login`

ล็อกอินผ่าน RADIUS — ถ้าผ่านจะสร้าง session cookie อัตโนมัติ

**Request Body:**
```json
{
  "studentId": "65xxxxxxxx",
  "password": "your_password"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "65xxxxxxxx"
  }
}
```

**Response 401 (RADIUS ปฏิเสธ):**
```json
{ "message": "RADIUS Access-Reject: Invalid credentials" }
```

**Response 400 (ข้อมูลไม่ครบ):**
```json
{ "message": "Student ID and password are required" }
```

---

### `POST /api/auth/logout`

ลบ session ออกจาก Redis และล้าง cookie

**Request:** ไม่ต้องส่ง body (แค่ต้องมี session cookie)

**Response 200:**
```json
{ "message": "Logout successful" }
```

---

### `GET /api/auth/me`

ดูข้อมูล user ที่ล็อกอินอยู่ (ต้องมี session)

**Request:** ไม่ต้องส่ง body

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "username": "65xxxxxxxx"
  }
}
```

**Response 401 (ไม่มี session):**
```json
{ "message": "Unauthorized: No active session" }
```

---

### `POST /api/auth/register`

> ⚠️ **ไม่รองรับ** — ระบบใช้ Auto-register ตอน Login
> จะได้รับ error ทันที

---

### `POST /api/auth/refresh`

> 🚧 **Placeholder** — ยังไม่ได้ implement

---

## 👥 Users Endpoints

> 🚧 **TODO** — routes ถูก define ไว้แล้ว แต่ service logic ยังไม่ได้ implement

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/api/users` | ดู user ทั้งหมด |
| `GET` | `/api/users/:id` | ดู user ตาม ID |
| `POST` | `/api/users` | สร้าง user ใหม่ |
| `PUT` | `/api/users/:id` | แก้ไข user |
| `DELETE` | `/api/users/:id` | ลบ user |

---

## 🏫 Rooms Endpoints

> 🚧 **TODO** — routes ถูก define ไว้แล้ว แต่ service logic ยังไม่ได้ implement

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/api/rooms` | ดูห้องทั้งหมด |
| `GET` | `/api/rooms/:id` | ดูห้องตาม ID |
| `POST` | `/api/rooms` | เพิ่มห้องใหม่ |
| `PUT` | `/api/rooms/:id` | แก้ไขห้อง |
| `DELETE` | `/api/rooms/:id` | ลบห้อง |

---

## 📷 QR Code Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `POST` | `/api/qrcode/generate` | สร้าง QR Code (Base64) โดยส่ง `roomCode`, `room_desc`, `adId` ใน body |

**ตัวอย่าง `POST /api/qrcode/generate`**

**Request Body:**
```json
{
  "roomCode": "A101",
  "room_desc": "ห้องเรียนรวม",
  "adId": "ad_001"
}
```

**Response 200:**
```json
{
  "message": "QR Code generated successfully",
  "data": {
    "roomCode": "A101",
    "room_desc": "ห้องเรียนรวม",
    "adId": "ad_001",
    "timestamp": "2026-03-09T18:00:00.000Z"
  },
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUh..."
}
```

---

## 📊 Dashboard Endpoint

> 🚧 **TODO** — route ถูก define ไว้แล้ว แต่ logic ยังไม่ได้ implement

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/api/dashboard` | ดูสถิติภาพรวม |

---

## 💻 ตัวอย่างการเรียก API (Frontend)

### ติดตั้ง Axios

```bash
npm install axios
```

### ตั้งค่า Axios Instance

```ts
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // ⚠️ สำคัญ! ต้องใส่เพื่อให้ส่ง cookie
});

export default api;
```

### ตัวอย่าง Login

```ts
import api from './lib/api';

async function login(studentId: string, password: string) {
  try {
    const res = await api.post('/auth/login', { studentId, password });
    console.log('Logged in:', res.data.user);
    // { id: 1, username: "65xxxxxxxx" }
  } catch (err: any) {
    console.error('Login failed:', err.response?.data?.message);
  }
}
```

### ตัวอย่าง ดูข้อมูลตัวเอง

```ts
async function getMe() {
  const res = await api.get('/auth/me');
  return res.data.user; // { id, username }
}
```

### ตัวอย่าง Logout

```ts
async function logout() {
  await api.post('/auth/logout');
  // cookie ถูกล้างอัตโนมัติ
}
```

### ตัวอย่าง React Hook

```tsx
import { useState, useEffect } from 'react';
import api from './lib/api';

function useAuth() {
  const [user, setUser] = useState(null);
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
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

---

## ⚙️ Environment Variables

| Variable | ค่าตัวอย่าง | คำอธิบาย |
|----------|-------------|----------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `SESSION_SECRET` | `my_super_secret` | Secret สำหรับ sign session |
| `RADIUS_HOST` | `127.0.0.1` | IP ของ RADIUS server |
| `RADIUS_PORT` | `1812` | Port ของ RADIUS (default: 1812) |
| `RADIUS_SECRET` | `radiussecret` | Shared secret กับ RADIUS |
| `PORT` | `3000` | Port ของ Express server |

---

## 🔧 Prisma Commands

```bash
# Generate Prisma client หลังแก้ schema
npx prisma generate

# สร้าง migration ใหม่
npx prisma migrate dev --name <ชื่อ migration>

# Apply migration บน production
npx prisma migrate deploy

# ดู DB ผ่าน Prisma Studio (GUI)
npx prisma studio

# Seed ข้อมูลเริ่มต้น
npx prisma db seed
```

---

## 🐳 รัน Project ด้วย Docker

```bash
# Dev
docker compose up -d

# ดู logs
docker compose logs -f app

# หยุด
docker compose down
```
