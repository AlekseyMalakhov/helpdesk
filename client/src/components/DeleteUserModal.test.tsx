import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import DeleteUserModal from "./DeleteUserModal";
import type { User } from "./UsersTable";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const AGENT: User = {
  id: "user-2",
  name: "Bob Agent",
  email: "bob@example.com",
  role: "agent",
  createdAt: "2024-03-20T00:00:00.000Z",
};

function renderModal(user: User = AGENT) {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  renderWithProviders(
    <DeleteUserModal open={true} user={user} onOpenChange={onOpenChange} onSuccess={onSuccess} />,
  );
  return { onOpenChange, onSuccess };
}

beforeEach(() => vi.resetAllMocks());

describe("DeleteUserModal", () => {
  it("shows the user's name in the confirmation message", () => {
    renderModal();
    expect(screen.getByText(/bob agent/i)).toBeInTheDocument();
  });

  it("calls DELETE /api/users/:id with credentials when Delete is clicked", async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `/api/users/${AGENT.id}`,
        { withCredentials: true },
      ),
    );
  });

  it("disables the Delete button and shows 'Deleting…' while the request is in flight", async () => {
    mockedAxios.delete = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    const btn = await screen.findByRole("button", { name: /deleting/i });
    expect(btn).toBeDisabled();
  });

  it("calls onSuccess after a successful deletion", async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it("shows the server error message when the request fails", async () => {
    mockedAxios.delete = vi.fn().mockRejectedValue({
      response: { data: { error: "User not found." } },
    });
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(await screen.findByText("User not found.")).toBeInTheDocument();
  });

  it("shows a generic fallback error when the server provides no message", async () => {
    mockedAxios.delete = vi.fn().mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears the error when the modal is closed and reopened", async () => {
    mockedAxios.delete = vi.fn().mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await screen.findByText("Something went wrong.");

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // onOpenChange is mocked so the dialog stays open in the test — verify
    // the mutation was reset by checking the error is gone after cancel
    expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
  });
});
