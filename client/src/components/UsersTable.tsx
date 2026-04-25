import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Role = "admin" | "agent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface Props {
  users: User[];
  isPending: boolean;
  isError: boolean;
  onEditClick: (user: User) => void;
  onDeleteClick: (user: User) => void;
}

const columns = ["Name", "Email", "Role", "Created", "Actions"];

function TableHeader() {
  return (
    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
      <tr>
        {columns.map((col, i) => (
          <th key={i} className="px-4 py-3 text-left font-medium">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default function UsersTable({ users, isPending, isError, onEditClick, onDeleteClick }: Props) {
  if (isError) {
    return <p className="text-sm text-red-600">Failed to load users</p>;
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <TableHeader />
        <tbody className="divide-y divide-gray-100 bg-white">
          {isPending
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-14 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClick(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(user)}
                          aria-label={`Delete ${user.name}`}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          {!isPending && users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
