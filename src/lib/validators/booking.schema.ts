import { z } from "zod";
import {
  customerNameSchema,
  dateStringSchema,
  timeStringSchema,
  uuidSchema,
  whatsappSchema,
} from "@/lib/validators/common.schema";

export const bookingCartItemSchema = z.object({
  serviceId: uuidSchema,
  name: z.string().min(1),
  duration: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const createBookingSchema = z.object({
  serviceIds: z.array(uuidSchema).min(1, "Selecione ao menos um serviço."),
  professionalId: uuidSchema,
  date: dateStringSchema,
  time: timeStringSchema,
  customerName: customerNameSchema,
  customerWhatsapp: whatsappSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingCartItemInput = z.infer<typeof bookingCartItemSchema>;

export const bookingCustomerFormSchema = z.object({
  customerName: customerNameSchema,
  customerWhatsapp: whatsappSchema,
});

export type BookingCustomerFormInput = z.infer<typeof bookingCustomerFormSchema>;
