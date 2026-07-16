import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderWhatsApp } from "@/lib/services/whatsapp.service";

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTimeParts(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

function isDueReminder(appointmentTime: string, now: Date) {
  const { hours, minutes } = getTimeParts(appointmentTime);
  const appointmentDate = new Date(now);
  appointmentDate.setHours(hours, minutes, 0, 0);

  const diffMinutes = (appointmentDate.getTime() - now.getTime()) / 60000;
  return diffMinutes >= 29.5 && diffMinutes <= 30.5;
}

async function processReminderDispatch() {
  const db = createAdminClient();
  const now = new Date();
  const todayDate = getLocalDateString(now);

  const { data, error } = await db.from("appointments").select("*").eq("appointment_date" as any, todayDate);
  if (error) {
    throw new Error(error.message);
  }

  const appointments = (data ?? []) as Array<any>;
  const dueAppointments = appointments
    .filter((appointment) => {
      const rawStatus = String(appointment.status ?? "").toLowerCase();
      if (["cancelado", "canceled", "nao compareceu", "não compareceu"].includes(rawStatus)) {
        return false;
      }

      return isDueReminder(appointment.appointment_time, now);
    })
    .sort((a, b) => (a.appointment_time ?? "").localeCompare(b.appointment_time ?? ""));

  const results: Array<{ appointmentId: string; sent: boolean; reason: string }> = [];

  for (const appointment of dueAppointments) {
    const reminderResult = await sendReminderWhatsApp({
      appointmentId: appointment.id,
      clientName: appointment.client_name ?? "Cliente",
      clientPhone: appointment.client_phone ?? "",
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
    });

    await db.from("notifications").insert([
      {
        appointment_id: appointment.id,
        type: "reminder_30min",
        status: reminderResult.sent ? "sent" : "failed",
        sent_at: reminderResult.sent ? new Date().toISOString() : null,
        error_message: reminderResult.sent ? null : reminderResult.reason,
        payload: {
          appointment_time: appointment.appointment_time,
          client_name: appointment.client_name,
          client_phone: appointment.client_phone,
        },
      },
    ]);

    results.push({
      appointmentId: appointment.id,
      sent: reminderResult.sent,
      reason: reminderResult.reason,
    });
  }

  return {
    processedAt: new Date().toISOString(),
    dueAppointments: dueAppointments.length,
    results,
  };
}

export async function GET() {
  try {
    const payload = await processReminderDispatch();
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar lembretes WhatsApp.",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const payload = await processReminderDispatch();
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar lembretes WhatsApp.",
      },
      { status: 500 },
    );
  }
}
