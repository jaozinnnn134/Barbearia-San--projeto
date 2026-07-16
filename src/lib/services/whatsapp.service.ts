import { normalizeWhatsapp } from "@/lib/services/scheduling.service";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;
const WHATSAPP_BUSINESS_NUMBER = "5519993298820";

interface SendReminderInput {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
}

function buildReminderMessage(clientName: string, appointmentDate: string, appointmentTime: string) {
  return [
    `Olá ${clientName}! 👋`,
    "Este é o lembrete do Barbearia San Thiago.",
    `Você tem um agendamento marcado para ${appointmentDate} às ${appointmentTime}.`,
    "Confirme sua presença com 30 minutos de antecedência.",
    "Obrigado!",
  ].join(" ");
}

function getProviderEndpoint(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/message/sendText`;
}

export async function sendReminderWhatsApp(input: SendReminderInput) {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY || !WHATSAPP_INSTANCE_ID) {
    return {
      sent: false,
      configured: false,
      reason: "Variáveis WHATSAPP_API_URL, WHATSAPP_API_KEY e WHATSAPP_INSTANCE_ID não configuradas.",
    };
  }

  const to = normalizeWhatsapp(input.clientPhone);
  if (!to) {
    return {
      sent: false,
      configured: true,
      reason: "Número do cliente inválido para envio do WhatsApp.",
    };
  }

  const response = await fetch(getProviderEndpoint(WHATSAPP_API_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_API_KEY}`,
      "X-Instance-Id": WHATSAPP_INSTANCE_ID,
    },
    body: JSON.stringify({
      instanceId: WHATSAPP_INSTANCE_ID,
      to,
      from: WHATSAPP_BUSINESS_NUMBER,
      text: buildReminderMessage(input.clientName, input.appointmentDate, input.appointmentTime),
      appointmentId: input.appointmentId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      sent: false,
      configured: true,
      reason: `Falha no provedor WhatsApp: ${response.status} ${errorText}`,
    };
  }

  return {
    sent: true,
    configured: true,
    reason: "Mensagem enviada com sucesso.",
  };
}
