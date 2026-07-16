import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingCartItem } from "@/types/database.types";

export type BookingStep =
  | "services"
  | "professional"
  | "date"
  | "time"
  | "customer"
  | "summary";

interface BookingStore {
  step: BookingStep;
  cart: BookingCartItem[];
  professionalId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  customerName: string;
  customerWhatsapp: string;

  setStep: (step: BookingStep) => void;
  addToCart: (item: BookingCartItem) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  isInCart: (serviceId: string) => boolean;
  setProfessionalId: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerWhatsapp: (whatsapp: string) => void;
  getTotalDuration: () => number;
  getTotalPrice: () => number;
  reset: () => void;
}

const initialState = {
  step: "services" as BookingStep,
  cart: [] as BookingCartItem[],
  professionalId: null as string | null,
  selectedDate: null as string | null,
  selectedTime: null as string | null,
  customerName: "",
  customerWhatsapp: "",
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      addToCart: (item) =>
        set((state) => {
          if (state.cart.some((c) => c.serviceId === item.serviceId)) {
            return state;
          }
          return { cart: [...state.cart, item] };
        }),

      removeFromCart: (serviceId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.serviceId !== serviceId),
        })),

      clearCart: () => set({ cart: [] }),

      isInCart: (serviceId) => get().cart.some((c) => c.serviceId === serviceId),

      setProfessionalId: (id) => set({ professionalId: id }),

      setSelectedDate: (date) => set({ selectedDate: date, selectedTime: null }),

      setSelectedTime: (time) => set({ selectedTime: time }),

      setCustomerName: (name) => set({ customerName: name }),

      setCustomerWhatsapp: (whatsapp) => set({ customerWhatsapp: whatsapp }),

      getTotalDuration: () =>
        get().cart.reduce((total, item) => total + item.duration, 0),

      getTotalPrice: () =>
        get().cart.reduce((total, item) => total + item.price, 0),

      reset: () => set(initialState),
    }),
    {
      name: "san-thiago-booking",
      partialize: (state) => ({
        cart: state.cart,
        professionalId: state.professionalId,
        selectedDate: state.selectedDate,
        selectedTime: state.selectedTime,
        customerName: state.customerName,
        customerWhatsapp: state.customerWhatsapp,
      }),
    },
  ),
);
