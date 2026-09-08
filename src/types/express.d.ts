declare global {
  namespace Express {
    interface Request {
      userId?: string;
      areaId?: string;
    }
  }
}

export {};
