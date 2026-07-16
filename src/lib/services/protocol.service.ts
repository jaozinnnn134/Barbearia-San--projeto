import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { BRAND } from "@/lib/constants/brand";

export function generateProtocol(): string {
  const zonedNow = toZonedTime(new Date(), APP_TIMEZONE);
  const year = format(zonedNow, "yyyy");
  const sequence = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `${BRAND.protocolPrefix}-${year}-${sequence}`;
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
}): string {
  const formatGCal = (date: Date): string =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    details: params.description,
    location: params.location,
    dates: `${formatGCal(params.startTime)}/${formatGCal(params.endTime)}`,
  });

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function buildIcsContent(params: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  protocol: string;
}): string {
  const formatIcs = (date: Date): string =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");

  const uid = `${params.protocol}@san-thiago`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barbearia San Thiago//Booking//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcs(new Date())}`,
    `DTSTART:${formatIcs(params.startTime)}`,
    `DTEND:${formatIcs(params.endTime)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${params.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
