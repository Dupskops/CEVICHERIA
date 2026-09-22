import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../../types/chatbot";

describe("ChatMessage", () => {
  const userMessage: ChatMessageType = {
    id: "msg-1",
    content: "Hola, ¿qué tal?",
    role: "user",
    timestamp: "2026-09-22T14:30:00",
  };

  const assistantMessage: ChatMessageType = {
    id: "msg-2",
    content: "**Ceviche Clásico** cuesta S/25.00",
    role: "assistant",
    timestamp: "2026-09-22T14:30:05",
  };

  it("muestra el mensaje del usuario con estilos de burbuja derecha", () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText("Hola, ¿qué tal?")).toBeInTheDocument();
  });

  it("convierte **texto** en <strong>", () => {
    render(<ChatMessage message={assistantMessage} />);
    const strong = screen.getByText("Ceviche Clásico");
    expect(strong.tagName).toBe("STRONG");
  });

  it("convierte saltos de línea en <br />", () => {
    const msg: ChatMessageType = {
      id: "msg-3",
      content: "Línea 1\nLínea 2",
      role: "assistant",
      timestamp: "2026-09-22T14:30:05",
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.innerHTML).toContain("<br />");
  });

  it("renderiza avatar del asistente pero no del usuario", () => {
    const { unmount } = render(<ChatMessage message={userMessage} />);
    // El usuario NO tiene avatar
    expect(screen.queryByText("🐟")).not.toBeInTheDocument();
    unmount();

    render(<ChatMessage message={assistantMessage} />);
    // El asistente SÍ tiene avatar
    expect(screen.getByText("🐟")).toBeInTheDocument();
  });
});
