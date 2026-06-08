import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { createUserSchema, ROLES, type CreateUserInput, type Role, type UserPublic } from '@caliper/shared';
import { apiErrorMessage } from '@/lib/api';
import { createUser, listUsers, updateUser } from '@/lib/usersApi';
import { toast } from '@/store/toast';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/features/parts/FormField';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ['users'] });

  const onChange = async (u: UserPublic, patch: { role?: Role; isActive?: boolean }) => {
    try {
      await updateUser(u.id, patch);
      toast.success('User updated');
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <PageHeader
          title="Users & roles"
          subtitle="Manage who can access the platform and what they can do"
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New user
            </Button>
          }
        />

        <Card>
          {users.isLoading ? (
            <TableSkeleton cols={4} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {users.data && users.data.length ? (
                  users.data.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-800">{u.name}</Td>
                      <Td className="text-slate-500">{u.email}</Td>
                      <Td>
                        <Select
                          value={u.role}
                          onChange={(e) => onChange(u, { role: e.target.value as Role })}
                          className="h-8 text-xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </Select>
                      </Td>
                      <Td>
                        <button onClick={() => onChange(u, { isActive: !u.isActive })}>
                          <Badge tone={u.isActive ? 'green' : 'gray'} dot>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow cols={4}>No users.</EmptyRow>
                )}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} />
    </AppLayout>
  );
}

function CreateUserDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { role: 'VIEWER' } });

  const submit = async (values: CreateUserInput) => {
    setServerError(null);
    try {
      await createUser(values);
      reset({ role: 'VIEWER' });
      toast.success('User created');
      onCreated();
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New user">
      <form className="space-y-3" onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Name" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Role" error={errors.role?.message}>
            <Select className="w-full" {...register('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Temporary password" error={errors.password?.message}>
          <Input type="text" placeholder="min 8 characters" {...register('password')} />
        </FormField>
        {serverError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">{serverError}</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create user'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
