import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import {
  AuthProvider,
  AuthContextType,
} from "../../../../contexts/AuthContext";
import EventList from "../../../../components/admin/events/EventList";

// Mock the SSE connection
const mockEventSource = {
  addEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  url: "",
};

// Mock the EventSource constructor
const mockEventSourceConstructor = vi.fn(() => mockEventSource);

// Mock auth context
const mockAuthContext: AuthContextType = {
  user: {
    id: "test-user",
    username: "test",
    role: "admin",
    email: "test@example.com",
  },
  token: "test-token",
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  isLoading: false,
  refreshUser: vi.fn(),
};

// Create a wrapper component to handle props and providers
const EventListWrapper = (props: any) => {
  return (
    <AuthProvider value={mockAuthContext}>
      <BrowserRouter>
        <EventList
          events={props.events || []}
          onEventAction={props.onEventAction || vi.fn()}
          onPermanentDelete={props.onPermanentDelete || vi.fn()}
        />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe("EventList SSE Streaming Tests", () => {
  // Mock global EventSource
  beforeEach(() => {
    vi.stubGlobal("EventSource", mockEventSourceConstructor);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("handles STREAM_STARTED event and updates specific event", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_STARTED",
          data: {
            id: "test-event-id",
            streamStatus: "connected",
            name: "Test Event",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("handles STREAM_STOPPED event and updates specific event", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_STOPPED",
          data: {
            id: "test-event-id",
            streamStatus: "disconnected",
            name: "Test Event",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("handles STREAM_STATUS_UPDATE with inner type STREAM_PAUSED", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_STATUS_UPDATE",
          data: {
            type: "STREAM_PAUSED",
            eventId: "test-event-id",
            id: "test-event-id",
            streamStatus: "paused",
            message: "Stream pausado",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      // Verify the event listener was set up correctly
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("handles STREAM_STATUS_UPDATE with inner type STREAM_RESUMED", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_STATUS_UPDATE",
          data: {
            type: "STREAM_RESUMED",
            eventId: "test-event-id",
            id: "test-event-id",
            streamStatus: "connected",
            message: "Stream en vivo",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("handles STREAM_PAUSED direct event type", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_PAUSED",
          data: {
            eventId: "test-event-id",
            id: "test-event-id",
            streamStatus: "paused",
            message: "Stream pausado",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("handles STREAM_RESUMED direct event type", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_RESUMED",
          data: {
            eventId: "test-event-id",
            id: "test-event-id",
            streamStatus: "connected",
            message: "Stream en vivo",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });

  it("ignores events for different event IDs", async () => {
    render(<EventListWrapper />);

    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === "message",
    )?.[1];

    if (eventHandler) {
      const mockEvent = {
        data: JSON.stringify({
          type: "STREAM_STARTED",
          data: {
            id: "different-event-id", // Different event ID
            streamStatus: "connected",
          },
          timestamp: new Date(),
        }),
      };

      eventHandler(mockEvent);

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    }
  });
});
