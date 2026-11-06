import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReservations } from "./useReservations";
import { listReservations } from "../services/managementApi";

vi.mock("../services/managementApi", () => ({ listReservations: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

const reservation = (estado: string) => ({
  idReserva: 2, nombre: "Cliente", fecha: "2026-11-05", hora: "12:00:00",
  mesa_id: "M-01", estado, comensales: 2,
});

it("libera una inasistencia y mantiene el historial visible", async () => {
  vi.mocked(listReservations).mockResolvedValue([reservation("no_asistio")]);
  const { result } = renderHook(() => useReservations());
  await waitFor(() => expect(result.current.reservations).toHaveLength(1));
  expect(result.current.getTableStatus("M-01", "2026-11-05", "12:15")).toBe("disponible");
  expect(result.current.getReservationsByDate("2026-11-05")[0].status).toBe("no_asistio");
});

it("mantiene ocupada la mesa hasta finalizar la atención", async () => {
  vi.mocked(listReservations).mockResolvedValue([reservation("ocupada")]);
  const { result } = renderHook(() => useReservations());
  await waitFor(() => expect(result.current.reservations).toHaveLength(1));
  expect(result.current.getTableStatus("M-01", "2026-11-05", "14:00")).toBe("ocupada");
});

it("consulta los cambios del servidor cada 15 segundos y limpia el intervalo", async () => {
  const interval = vi.spyOn(window, "setInterval");
  const clear = vi.spyOn(window, "clearInterval");
  vi.mocked(listReservations).mockResolvedValue([reservation("confirmada")]);
  const { result, unmount } = renderHook(() => useReservations());
  await waitFor(() => expect(result.current.reservations).toHaveLength(1));
  const call = interval.mock.calls.find(([, ms]) => ms === 15000)!;
  vi.mocked(listReservations).mockResolvedValue([reservation("no_asistio")]);
  await act(async () => { await (call[0] as () => Promise<void>)(); });
  await waitFor(() => expect(result.current.reservations[0].status).toBe("no_asistio"));
  unmount();
  expect(clear).toHaveBeenCalled();
});
