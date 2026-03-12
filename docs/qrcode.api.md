# 📷 QR Code Endpoints

> **Base URL:** `/api/qrcode`
> **Storage:** Token ถูกเก็บใน Memory (Map) หายเมื่อ Server Restart

## Endpoints

### 1. Generate QR Token
`POST /qrcode/generate`

สร้าง QR Token ใหม่สำหรับ class session (เรียกจาก Booth/อาจารย์)

**Request Body:**
```json
{
  "class_session_id": 1,
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

**Response `200 OK`:**
```json
{
  "qr_token": "a1b2c3d4e5f67890",
  "scan_url": "http://localhost:3000/scan?token=a1b2c3d4e5f67890",
  "expires_in": 300,
  "metadata": { ... }
}
```

#### 💻 Frontend Usage (Booth Side)
```ts
const generateToken = async (classSessionId) => {
  const res = await api.post('/qrcode/generate', { class_session_id: classSessionId });
  return res.data; // { qr_token, scan_url, ... }
};
```

---

### 2. Scan QR Token (Discovery)
`POST /qrcode/scan`

สแกน QR — ระบบจะวิเคราะห์ว่าควรทำ action อะไร (CHECK_IN, CHECK_OUT, SWAP)

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f67890",
  "studentId": "65015234"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "action": "CHECK_IN",
  "metadata": { ... }
}
```

#### 💻 Frontend Usage (Student Side - Discovery)
```ts
const scanQr = async (token, studentId) => {
  const res = await api.post('/qrcode/scan', { token, studentId });
  return res.data; // { success, action, metadata }
};
```

---

### 3. QR Action Confirmation
`POST /qrcode/action`

ยืนยันการทำ Check-in / Check-out / Swap จริง

**Request Body:**
```json
{
  "action": "CHECK_IN",
  "studentId": "65015234",
  "token": "a1b2c3d4e5f67890",
  "isGuest": false
}
```

**Behavior:** 
- `CHECK_IN`: สร้าง Record ใหม่
- `CHECK_OUT`: ปิด Record เดิม
- `SWAP`: ปิด Record เดิมห้องอื่น และเปิด Record ใหม่ห้องนี้
*หมายเหตุ: จะมีการ Upsert User อัตโนมัติหากยังไม่มีข้อมูล*

#### 💻 Frontend Usage (Student Side - Confirmation)
```ts
const confirmAction = async (action, studentId, token, isGuest = false) => {
  const res = await api.post('/qrcode/action', { action, studentId, token, isGuest });
  return res.data;
};
```

---

### 4. Poll QR Status
`GET /qrcode/poll/:class_session_id`

Booth เช็คว่า Token ปัจจุบันถูกสแกนไปหรือยัง

**Response `200 OK`:**
```json
{ "used": true }
```

#### 💻 Frontend Usage (Booth Polling)
```ts
const checkStatus = async (classSessionId) => {
  const res = await api.get(`/qrcode/poll/${classSessionId}`);
  return res.data.used; // true = should refresh QR
};
```
