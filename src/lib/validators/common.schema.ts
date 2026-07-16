import { z } from "zod";

export const whatsappSchema = z
  .string()
  .min(14, "WhatsApp inválido.")
  .max(20, "WhatsApp inválido.")
  .refine(
    (value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 11 || (digits.length === 13 && digits.startsWith("55"));
    },
    { message: "Informe um WhatsApp válido com DDD." },
  );

export const customerNameSchema = z
  .string()
  .min(3, "Nome deve ter pelo menos 3 caracteres.")
  .max(120, "Nome muito longo.")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos.");

export const uuidSchema = z.string().uuid("Identificador inválido.");

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Horário inválido.");
