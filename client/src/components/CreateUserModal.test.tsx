import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import CreateUserModal from "./CreateUserModal";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const VALID = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "password123",
};

function renderModal() {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  renderWithProviders(
    <CreateUserModal open={true} onOpenChange={onOpenChange} onSuccess={onSuccess} />,
  );
  return { onOpenChange, onSuccess };
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: Partial<typeof VALID> = VALID,
) {
  if (values.name) await user.type(screen.getByLabelText("Name"), values.name);
  if (values.email) await user.type(screen.getByLabelText("Email"), values.email);
  if (values.password) await user.type(screen.getByLabelText("Password"), values.password);
}

beforeEach(() => vi.resetAllMocks());

describe("CreateUserModal form", () => {
  it("renders name, email, and password fields", () => {
    renderModal();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows a validation error when name is too short", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Name"), "ab");
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    expect(
      await screen.findByText("Name must be at least 3 characters."),
    ).toBeInTheDocument();
  });

  it("shows a validation error when email is invalid", async () => {
    const user = userEvent.setup();
    renderModal();

    await fillForm(user, { ...VALID, email: "not-an-email" });
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    expect(
      await screen.findByText("Valid email is required."),
    ).toBeInTheDocument();
  });

  it("shows a validation error when password is too short", async () => {
    const user = userEvent.setup();
    renderModal();

    await fillForm(user, { ...VALID, password: "short" });
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    expect(
      await screen.findByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
  });

  it("applies a red border to every invalid field after a failed submit", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await waitFor(() => {
      for (const label of ["Name", "Email", "Password"]) {
        expect(screen.getByLabelText(label)).toHaveClass("border-red-500");
      }
    });
  });

  it("does not call the API when the form is invalid", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await screen.findByText("Name must be at least 3 characters.");
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("submits the correct payload to POST /api/users", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderModal();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/users",
        VALID,
        { withCredentials: true },
      ),
    );
  });

  it("disables the submit button and shows 'Creating…' while the request is in flight", async () => {
    mockedAxios.post = vi.fn(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderModal();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    const btn = await screen.findByRole("button", { name: /creating/i });
    expect(btn).toBeDisabled();
  });

  it("calls onSuccess and resets the form after a successful submission", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("");
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("");
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("");
  });

  it("shows the server error on the email field when the email is already in use", async () => {
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { data: { error: "Email already in use." } },
    });
    const user = userEvent.setup();
    renderModal();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    expect(await screen.findByText("Email already in use.")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
