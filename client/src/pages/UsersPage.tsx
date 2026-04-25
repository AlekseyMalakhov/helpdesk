import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import CreateUserModal from "@/components/CreateUserModal";
import EditUserModal from "@/components/EditUserModal";
import DeleteUserModal from "@/components/DeleteUserModal";
import UsersTable, { type User } from "@/components/UsersTable";

type ModalState = { type: "create" } | { type: "edit"; user: User } | { type: "delete"; user: User } | null;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>(null);

  const {
    data: users = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      axios
        .get<User[]>("/api/users", { withCredentials: true })
        .then((r) => r.data),
  });

  function handleMutationSuccess() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    setModal(null);
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <Button onClick={() => setModal({ type: "create" })}>
          Create User
        </Button>
      </div>
      {modal?.type === "create" && (
        <CreateUserModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setModal(null);
          }}
          onSuccess={handleMutationSuccess}
        />
      )}
      {modal?.type === "edit" && (
        <EditUserModal
          key={modal.user.id}
          user={modal.user}
          open={true}
          onOpenChange={(open) => {
            if (!open) setModal(null);
          }}
          onSuccess={handleMutationSuccess}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteUserModal
          key={modal.user.id}
          user={modal.user}
          open={true}
          onOpenChange={(open) => {
            if (!open) setModal(null);
          }}
          onSuccess={handleMutationSuccess}
        />
      )}

      <UsersTable
        users={users}
        isPending={isPending}
        isError={isError}
        onEditClick={(user) => setModal({ type: "edit", user })}
        onDeleteClick={(user) => setModal({ type: "delete", user })}
      />
    </main>
  );
}
