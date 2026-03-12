# 🌐 Next.js Integration Guide

คู่มือการเชื่อมต่อ Next.js (App Router) กับ Backend API โดยใช้ Session-based Authentication

## 1. Environment Variables
สร้างไฟล์ `.env.local` ในโปรเจกต์ Next.js:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 2. Axios Instance Setup
สร้างไฟล์ `src/lib/api.ts` เพื่อจัดการ Request:

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // ⚠️ สำคัญ: เพื่อให้ Browser ส่ง Session Cookie (connect.sid)
});

// จัดการ Response Error เช่น Session หมดอายุ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect ไปหน้า Login หรือล้างข้อมูลใน Context
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 3. Authentication Context & Hook
สร้าง `src/context/AuthContext.tsx`:

```tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  studentId: string;
  fname: string;
  lname: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบ Session เมื่อโหลดหน้าเว็บ
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
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## 4. Protecting Routes
ในไฟล์หน้าเว็บ (เช่น `app/dashboard/page.tsx`):

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>ยินดีต้อนรับคุณ {user.fname}</h1>
      {/* ... คอนเทนต์ของคุณ */}
    </div>
  );
}
```

## 5. การใช้ใน Server Components (ตัวเลือก)
เนื่องจาก Next.js Server Components ทำงานฝั่ง Server การแนบ Cookie ต้องดึงจาก `headers()`:

```tsx
// src/lib/api-server.ts
import { cookies } from 'next/headers';

export async function getMeServer() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('connect.sid');

  const res = await fetch(`${process.env.API_URL}/auth/me`, {
    headers: {
      Cookie: `connect.sid=${sessionCookie?.value}`,
    },
  });
  
  if (!res.ok) return null;
  return res.json();
}
```

---
> [!IMPORTANT]
> - อย่าลืมครอบ `AuthProvider` ใน `layout.tsx`
> - ตรวจสอบว่า Backend allow CORS มายังโดเมนของ Next.js (รวมถึง `credentials: true`)
