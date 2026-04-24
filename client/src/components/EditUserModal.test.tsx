import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import EditUserModal from "./EditUserModal";
import type { User } from "./UsersTable";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const EXISTING: User = {
  id: "user-1",
  name: "Alice Admin",
  email: "alice@example.com",
  role: "admin",
  createdAt: "2024-01-15T00:00:00.000Z",
};

function renderModal(user: User = EXISTING) {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  renderWithProviders(
    <EditUserModal open={true} user={user} onOpenChange={onOpenChange} onSuccess={onSuccess} />,
  );
  return { onOpenChange, onSuccess };
}

beforeEach(() => vi.resetAllMocks());

describe("EditUserModal form", () => {
  it("pre-populates name and email from the user prop", () => {
    renderModal();
    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(EXISTING.name);
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe(EXISTING.email);
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("");
  });

  it("shows a validation error when name is too short", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "ab");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(
      await screen.findByText("Name must be at least 3 characters."),
    ).toBeInTheDocument();
  });

  it("shows a validation error when email is invalid", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(await screen.findByText("Valid email is required.")).toBeInTheDocument();
  });

  it("shows a validation error when password is too short", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(
      await screen.findByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
  });

  it("submits without password when the password field is left blank", async () => {
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `/api/users/${EXISTING.id}`,
        { name: EXISTING.name, email: EXISTING.email },
        { withCredentials: true },
      ),
    );
  });

  it("includes password in the payload when one is provided", async () => {
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Password"), "newpassword");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    await waitFor(() =>
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `/api/users/${EXISTING.id}`,
        { name: EXISTING.name, email: EXISTING.email, password: "newpassword" },
        { withCredentials: true },
      ),
    );
  });

  it("disables the submit button and shows 'Saving…' while the request is in flight", async () => {
    mockedAxios.patch = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const btn = await screen.findByRole("button", { name: /saving/i });
    expect(btn).toBeDisabled();
  });

  it("calls onSuccess after a successful submission", async () => {
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it("shows the server error on the email field when the email is already in use", async () => {
    mockedAxios.patch = vi.fn().mockRejectedValue({
      response: { data: { error: "Email already in use." } },
    });
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(await screen.findByText("Email already in use.")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
