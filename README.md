# Docker Setup Guide

## How to Setup Docker-compose (For Developer and Server)

### 1. สำหรับ Developer

เราจะใช้ไฟล์ Override เพื่อให้สามารถแก้ไขโค้ดได้ทันที (Hot Reload)

1. Copy ไฟล์ `docker-compose.override.example.yml`
2. เปลี่ยนชื่อเป็น `docker-compose.override.yml`
3. รันคำสั่ง: `docker compose up -d` (Docker จะอ่านทั้งไฟล์หลักและไฟล์ Override ให้อัตโนมัติ)

### 2. สำหรับ Server

บน Server เราต้องการความนิ่งและสภาพแวดล้อมที่เหมือนกันทุกครั้ง

1. **ไม่ต้องสร้าง** ไฟล์ `docker-compose.override.yml`
2. รันคำสั่งโดยระบุไฟล์หลักอย่างเดียวเพื่อความชัวร์:
   `docker compose -f docker-compose.yml up -d`

## 🚨🚨🚨 คำเตือน 🚨🚨🚨

    - commit `docker-compose.override.yml` ให้เพิ่มชื่อไฟล์นี้ลงใน `.gitignore` เสมอ
    - Server ให้ใช้ docker-compose.yml แค่ไฟล์เดียว ห้ามมี override ติดไปด้วย

## How to Install Dependencies

### 1. สำหรับ Developer

1. ไปที่ root directory
2. รันคำสั่ง:\
   `npm i`\
   `npx prisma generate`\
   `echo -e "PORT=3000\nDATABASE_URL=\"เอาที่โอนลี่ส่งให้ในกลุ่มมาใส่ตรงนี้\"" > .env`
3. แทนที่ "เอาที่โอนลี่ส่งให้ในกลุ่มมาใส่ตรงนี้" ด้วย DATABASE_URL ที่โอนลี่ส่งให้
4. รันคำสั่ง: `docker compose up -d`

### เพิ่มเติมในส่วนของการทดสอบระบบเซิฟเว่อ
1. ต้องติดตั้ง:\
      npm install
2. จากนั้นรันคำสั่ง
      npx prisma generate:
      docker compose up -d
      npm run dev
### ตรวจสอบผ่านหน้าบราวเซอร์ "http://localhost:3000"
