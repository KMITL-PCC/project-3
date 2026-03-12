import type { NextFunction, Request, Response } from "express";

type User = {
  id: number;
  name: string;
  role: "admin" | "user" | "guest";
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Auth middleware");

  const user: User[] = [
    {
      id: 1,
      name: "Somsri Rongrod",
      role: "admin",
    },
    {
      id: 2,
      name: "Somsjai Bundai",
      role: "user",
    },
    {
      id: 3,
      name: "Samak Samarn",
      role: "guest",
    },
  ];

  if (user[1].role === "admin" || user[1].role === "user") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }
};

export default authMiddleware;
