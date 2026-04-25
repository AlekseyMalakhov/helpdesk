import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/components/UsersTable";

interface Props {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteUserModal({ user, open, onOpenChange, onSuccess }: Props) {
  const mutation = useMutation({
    mutationFn: () => axios.delete(`/api/users/${user.id}`, { withCredentials: true }),
    onSuccess: () => onSuccess(),
  });

  function handleOpenChange(value: boolean) {
    if (!value) mutation.reset();
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mt-2">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">{user.name}</span>? This action
          cannot be undone.
        </p>
        {mutation.isError && (
          <p className="text-sm text-red-600 mt-1">
            {(mutation.error as any)?.response?.data?.error ?? "Something went wrong."}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
