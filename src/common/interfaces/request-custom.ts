import { Request } from "express";

export interface RequestCustom extends Request {
  user?: {
    sub: string;
    username: string;
  }
}