// src/chat/chat.controller.ts
import { Router, Request, Response } from "express";
import { ChatService } from "./chat.service";

const router = Router();
const chatService = new ChatService();

// 🔹 Listar salas activas
router.get("/rooms", (req: Request, res: Response) => {
  res.json({ rooms: chatService.getAllSessions() });
});

// 🔹 Obtener mensajes de una sala
router.get("/rooms/:id/messages", (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ messages: chatService.getMessages(id) });
});

export { router as chatRouter, chatService };
