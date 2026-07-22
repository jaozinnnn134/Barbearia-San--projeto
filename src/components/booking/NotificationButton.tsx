"use client";

import { useEffect } from "react";
import { listenToMessages, requestNotificationPermission } from "@/lib/useNotification";

export default function NotificationButton() {
  // Inicia a escuta de mensagens em primeiro plano assim que o componente carrega
  useEffect(() => {
    listenToMessages();
  }, []);

  const handleClick = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      alert("Notificações ativadas com sucesso no seu dispositivo!");
    } else {
      alert("Não foi possível ativar as notificações. Verifique a permissão do seu navegador.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-xl bg-brand-bronze px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-graphite transition-all hover:bg-brand-bronze/80 shadow-md flex items-center gap-2"
    >
      🔔 Ativar Notificações
    </button>
  );
}