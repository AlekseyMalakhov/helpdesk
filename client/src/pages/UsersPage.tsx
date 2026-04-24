import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import CreateUserModal from "@/components/CreateUserModal";
import UsersTable, { type User } from "@/components/UsersTable";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      axios.get<User[]>("/api/users", { withCredentials: true }).then((r) => r.data),
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}>Create User</Button>
      </div>
      <CreateUserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          setModalOpen(false);
        }}
      />
      <UsersTable users={users} isPending={isPending} isError={isError} />
    </main>
  );
}
