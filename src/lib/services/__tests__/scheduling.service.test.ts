import { describe, expect, it } from "vitest";
import type { Appointment } from "@/types/database.types";
import {
  formatWhatsappMask,
  generateAvailableSlots,
  getDayScheduleWindow,
  hasTimeOverlap,
  normalizeWhatsapp,
  sumCartDuration,
  sumCartPrice,
  validateSlotAvailability,
} from "@/lib/services/scheduling.service";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/constants/business-hours";

describe("scheduling.service", () => {
  describe("normalizeWhatsapp", () => {
    it("normaliza número com 11 dígitos", () => {
      expect(normalizeWhatsapp("(11) 98765-4321")).toBe("5511987654321");
    });

    it("mantém número já com código do país", () => {
      expect(normalizeWhatsapp("5511987654321")).toBe("5511987654321");
    });
  });

  describe("formatWhatsappMask", () => {
    it("aplica máscara brasileira progressiva", () => {
      expect(formatWhatsappMask("11987654321")).toBe("(11) 98765-4321");
    });
  });

  describe("sumCartDuration / sumCartPrice", () => {
    it("soma duração e preço do carrinho", () => {
      const cart = [
        { serviceId: "1", name: "Corte", duration: 30, price: 35 },
        { serviceId: "2", name: "Barba", duration: 30, price: 25 },
      ];
      expect(sumCartDuration(cart)).toBe(60);
      expect(sumCartPrice(cart)).toBe(60);
    });
  });

  describe("getDayScheduleWindow", () => {
    it("bloqueia segunda-feira", () => {
      const window = getDayScheduleWindow("2026-07-13", DEFAULT_BUSINESS_HOURS, []);
      expect(window.open).toBe(false);
    });

    it("abre terça a sábado com horário estendido", () => {
      const window = getDayScheduleWindow("2026-07-14", DEFAULT_BUSINESS_HOURS, []);
      expect(window.open).toBe(true);
      expect(window.start).toBe("09:00");
      expect(window.end).toBe("19:00");
    });

    it("abre domingo com horário reduzido", () => {
      const window = getDayScheduleWindow("2026-07-12", DEFAULT_BUSINESS_HOURS, []);
      expect(window.open).toBe(true);
      expect(window.end).toBe("12:00");
    });

    it("trata feriado como horário reduzido", () => {
      const window = getDayScheduleWindow(
        "2026-07-14",
        DEFAULT_BUSINESS_HOURS,
        ["2026-07-14"],
      );
      expect(window.end).toBe("12:00");
    });
  });

  describe("hasTimeOverlap", () => {
    it("detecta sobreposição temporal", () => {
      const startA = new Date("2026-07-14T14:00:00-03:00");
      const endA = new Date("2026-07-14T15:00:00-03:00");
      const startB = new Date("2026-07-14T14:30:00-03:00");
      const endB = new Date("2026-07-14T15:30:00-03:00");
      expect(hasTimeOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it("não detecta overlap quando slots são adjacentes", () => {
      const startA = new Date("2026-07-14T14:00:00-03:00");
      const endA = new Date("2026-07-14T15:00:00-03:00");
      const startB = new Date("2026-07-14T15:00:00-03:00");
      const endB = new Date("2026-07-14T16:00:00-03:00");
      expect(hasTimeOverlap(startA, endA, startB, endB)).toBe(false);
    });
  });

  describe("generateAvailableSlots", () => {
    const existingAppointments: Appointment[] = [
      {
        id: "a1",
        protocol: "ST-2026-0001",
        customer_id: "c1",
        professional_id: "p1",
        status: "Agendado",
        start_time: "2026-07-14T14:00:00.000Z",
        end_time: "2026-07-14T15:00:00.000Z",
        total_duration: 60,
        total_price: 60,
        notes: null,
        created_at: "",
        updated_at: "",
      },
    ];

    it("gera slots e marca indisponíveis por conflito", () => {
      const slots = generateAvailableSlots({
        date: "2026-07-14",
        totalDurationMinutes: 60,
        businessHours: DEFAULT_BUSINESS_HOURS,
        holidays: [],
        existingAppointments,
        now: new Date("2026-07-13T12:00:00-03:00"),
      });

      expect(slots.length).toBeGreaterThan(0);
      const slot1400 = slots.find((s) => s.start === "14:00");
      expect(slot1400?.available).toBe(false);
    });

    it("reserva janela completa de 1h para corte + barba às 14:00", () => {
      const slots = generateAvailableSlots({
        date: "2026-07-14",
        totalDurationMinutes: 60,
        businessHours: DEFAULT_BUSINESS_HOURS,
        holidays: [],
        existingAppointments: [
          {
            ...existingAppointments[0]!,
            start_time: "2026-07-14T17:00:00.000Z",
            end_time: "2026-07-14T18:00:00.000Z",
          },
        ],
        now: new Date("2026-07-13T12:00:00-03:00"),
      });

      const availableStarts = slots.filter((s) => s.available).map((s) => s.start);
      expect(availableStarts).toContain("09:00");
    });
  });

  describe("validateSlotAvailability", () => {
    it("valida slot livre", () => {
      const valid = validateSlotAvailability(
        "2026-07-14",
        "09:00",
        30,
        DEFAULT_BUSINESS_HOURS,
        [],
        [],
      );
      expect(valid).toBe(true);
    });
  });
});
