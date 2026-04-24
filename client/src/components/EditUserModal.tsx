import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editUserSchema, type EditUserInput } from "@helpdesk/core";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/components/UsersTable";

interface Props {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, open, onOpenChange, onSuccess }: Props) {
  const form = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, email: user.email, password: "" },
  });

  useEffect(() => {
    form.reset({ name: user.name, email: user.email, password: "" });
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (values: EditUserInput) => {
      const body: Record<string, string> = { name: values.name, email: values.email };
      if (values.password) body.password = values.password;
      return axios.patch(`/api/users/${user.id}`, body, { withCredentials: true });
    },
    onSuccess: () => {
      form.reset();
      onSuccess();
    },
    onError: (err: any) => {
      const message = err.response?.data?.error ?? "Something went wrong.";
      if (message.toLowerCase().includes("email")) {
        form.setError("email", { message });
      }
    },
  });

  function handleOpenChange(value: boolean) {
    if (!value) form.reset({ name: user.name, email: user.email, password: "" });
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane Doe"
                      className={fieldState.invalid ? "border-red-500" : ""}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      className={fieldState.invalid ? "border-red-500" : ""}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      className={fieldState.invalid ? "border-red-500" : ""}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
