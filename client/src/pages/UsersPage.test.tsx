import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import UsersPage from "./UsersPage";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const USERS = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "admin",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "agent",
    createdAt: "2024-03-20T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UsersPage", () => {
  it("shows skeleton rows while loading", () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    renderWithProviders(<UsersPage />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("cell", { name: /alice/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a row for each user after data loads", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithProviders(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("Alice Admin")).toBeInTheDocument(),
    );
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("renders role badges with correct text", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Alice Admin"));
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("agent")).toBeInTheDocument();
  });

  it("renders formatted created-at dates", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Alice Admin"));
    expect(
      screen.getByText(
        new Date("2024-01-15T00:00:00.000Z").toLocaleDateString(),
      ),
    ).toBeInTheDocument();
  });

  it("shows empty state when no users are returned", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithProviders(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("No users found.")).toBeInTheDocument(),
    );
  });

  it("shows error message when the request fails", async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error("Network Error"));
    renderWithProviders(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("Failed to load users")).toBeInTheDocument(),
    );
  });

  it("calls the correct endpoint with credentials", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Alice Admin"));
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/users", {
      withCredentials: true,
    });
  });
});
