import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPartSchema, type CreatePartInput, type Customer, type PartListItem } from '@caliper/shared';
import { apiErrorMessage } from '@/lib/api';
import { createPart } from '@/lib/partsApi';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function CreatePartDialog({
  open,
  onClose,
  customers,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreated: (part: PartListItem) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePartInput>({
    resolver: zodResolver(createPartSchema),
    defaultValues: { status: 'ACTIVE', uom: 'NOS' },
  });

  const submit = async (values: CreatePartInput) => {
    setServerError(null);
    try {
      const part = await createPart(values);
      reset({ status: 'ACTIVE', uom: 'NOS' });
      onCreated(part);
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not create part'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New part">
      <form className="space-y-3" onSubmit={handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Part number" error={errors.partNo?.message}>
            <Input placeholder="CLP-1234" {...register('partNo')} />
          </Field>
          <Field label="Customer" error={errors.customerId?.message}>
            <Select className="w-full" defaultValue="" {...register('customerId')}>
              <option value="" disabled>
                Select…
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message}>
          <Input placeholder="Hydraulic manifold block" {...register('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Material" error={errors.material?.message}>
            <Input placeholder="EN8" {...register('material')} />
          </Field>
          <Field label="Drawing no." error={errors.drawingNo?.message}>
            <Input placeholder="ACM-MB-001" {...register('drawingNo')} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Status" error={errors.status?.message}>
            <Select className="w-full" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="NPD">NPD</option>
            </Select>
          </Field>
          <Field label="Current price" error={errors.currentPrice?.message}>
            <Input type="number" step="0.01" placeholder="0.00" {...register('currentPrice')} />
          </Field>
          <Field label="Std cycle (min)" error={errors.stdCycleMin?.message}>
            <Input type="number" step="0.01" placeholder="0.00" {...register('stdCycleMin')} />
          </Field>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create part'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
