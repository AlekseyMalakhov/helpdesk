import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Delete User", () => {
  it("renders a delete button for agent rows but not for admin rows", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Alice Admin"));

    expect(screen.getByRole("button", { name: /delete bob agent/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete alice admin/i })).not.toBeInTheDocument();
  });

  it("opens the confirmation modal when the delete button is clicked", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Bob Agent"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete bob agent/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
  });

  it("closes the modal and refetches users after a successful deletion", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    mockedAxios.delete = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Bob Agent"));

    await user.click(screen.getByRole("button", { name: /delete bob agent/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("closes the modal when Cancel is clicked without making a DELETE request", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText("Bob Agent"));

    await user.click(screen.getByRole("button", { name: /delete bob agent/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });
});

describe("Create User modal", () => {
  it("opens when the Create User button is clicked", async () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes when clicking outside the dialog", async () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // The overlay is the Radix backdrop — a sibling to the dialog content in the portal
    const overlay = document.querySelector<HTMLElement>(
      '[data-state="open"]:not([role="dialog"])',
    );
    await user.click(overlay!);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
