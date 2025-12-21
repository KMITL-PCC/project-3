# Docker


## How to Setup Docker-compose (For Developer and Server)

### สร้างไฟล์ override สำหรับ Dev (เพื่อให้แก้โค้ดได้)
    - สำหรับ Dev ให้ Copy ไฟล์ `docker-compose.override.example.yml` แล้วเปลี่ยนชื่อไฟล์เป็น `docker-compose.override.yml`
    - สำหรับ Server ให้ใช้แค่ `docker-compose.yml`

## 🚨🚨🚨 คำเตือน 🚨🚨🚨
    - ห้าม commit docker-compose.override.yml เด็ดขาด ให้ใส่ docker-compose.override.yml
    - Server ให้ใช้ docker-compose.yml แค่ไฟล์เดียวไม่ต้องใช้ docker-compose.override.yml