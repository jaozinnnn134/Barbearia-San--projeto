"use client";

import { getMessagingInstance } from "./firebase";
import { onMessage, getToken } from "firebase/messaging";

export async function listenToMessages() {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Notificação recebida em primeiro plano:", payload);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const title = payload.notification?.title || "Novo Agendamento!";
        const options = {
          body: payload.notification?.body || "Você recebeu um novo agendamento.",
          icon: "/logo.png",
          vibrate: [200, 100, 200],
        };

        new Notification(title, options);

        try {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(() => {});
        } catch (e) {
          console.log("Erro ao tocar áudio:", e);
        }
      }
    }
  });
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("Notificações não suportadas neste ambiente.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const messaging = await getMessagingInstance();
      if (!messaging) return null;

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      console.log("=== SEU TOKEN FCM DA BARBEARIA ===");
      console.log(token);

      return token;
    }
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
  }

  return null;
}