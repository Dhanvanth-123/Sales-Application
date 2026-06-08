import { useState } from 'react';
import { useForm, type DefaultValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLabourSchema,
  createOperationSchema,
  createQuotationSchema,
  createSaleSchema,
  type CreateLabourInput,
  type CreateOperationInput,
  type CreateQuotationInput,
  type CreateSaleInput,
} from '@caliper/shared';
import { apiErrorMessage } from '@/lib/api';
import { addLabour, addOperation, createQuotation, createSale } from '@/lib/partsApi';
import { toast } from '@/store/toast';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';

const today = () => new Date().toISOString().slice(0, 10);

interface AddDialogProps {
  partId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Shared form scaffold for the small "add record" dialogs. */
function useAddForm<T extends Record<string, unknown>>(
  schema: Parameters<typeof zodResolver>[0],
  defaults: DefaultValues<T>,
) {
  const form = useForm<T>({ resolver: zodResolver(schema) as Resolver<T>, defaultValues: defaults });
  const [serverError, setServerError] = useState<string | null>(null);
  return { ...form, serverError, setServerError };
}

function Actions({ submitting, label, onClose }: { submitting: boolean; label: string; onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : label}
      </Button>
    </div>
  );
}

// ── Add Sale (SALES) ──
export function AddSaleDialog({ partId, open, onClose, onSuccess }: AddDialogProps) {
  const f = useAddForm<CreateSaleInput>(createSaleSchema, { date: today() } as DefaultValues<CreateSaleInput>);
  const submit = async (values: CreateSaleInput) => {
    f.setServerError(null);
    try {
      await createSale(partId, values);
      f.reset({ date: today() } as DefaultValues<CreateSaleInput>);
      toast.success('Saved');
      onSuccess();
      onClose();
    } catch (err) {
      f.setServerError(apiErrorMessage(err));
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add sale">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="SO number" error={f.formState.errors.soNo?.message}>
            <Input placeholder="SO-2026-001" {...f.register('soNo')} />
          </FormField>
          <FormField label="Quantity" error={f.formState.errors.qty?.message}>
            <Input type="number" {...f.register('qty')} />
          </FormField>
          <FormField label="Unit price" error={f.formState.errors.unitPrice?.message}>
            <Input type="number" step="0.01" {...f.register('unitPrice')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Actions submitting={f.formState.isSubmitting} label="Add sale" onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Add Quotation (SALES) ──
export function AddQuotationDialog({ partId, open, onClose, onSuccess }: AddDialogProps) {
  const f = useAddForm<CreateQuotationInput>(createQuotationSchema, {
    date: today(),
    status: 'PENDING',
  } as DefaultValues<CreateQuotationInput>);
  const submit = async (values: CreateQuotationInput) => {
    f.setServerError(null);
    try {
      await createQuotation(partId, values);
      f.reset({ date: today(), status: 'PENDING' } as DefaultValues<CreateQuotationInput>);
      toast.success('Saved');
      onSuccess();
      onClose();
    } catch (err) {
      f.setServerError(apiErrorMessage(err));
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add quotation">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quote number" error={f.formState.errors.quoteNo?.message}>
            <Input placeholder="QT-2026-001" {...f.register('quoteNo')} />
          </FormField>
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="Quantity" error={f.formState.errors.qty?.message}>
            <Input type="number" {...f.register('qty')} />
          </FormField>
          <FormField label="Quoted price" error={f.formState.errors.quotedPrice?.message}>
            <Input type="number" step="0.01" {...f.register('quotedPrice')} />
          </FormField>
          <FormField label="Status" error={f.formState.errors.status?.message}>
            <Select className="w-full" {...f.register('status')}>
              <option value="PENDING">Pending</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </Select>
          </FormField>
          <FormField label="Valid until" error={f.formState.errors.validUntil?.message}>
            <Input type="date" {...f.register('validUntil')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Actions submitting={f.formState.isSubmitting} label="Add quotation" onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Add Labour (COSTING) ──
export function AddLabourDialog({ partId, open, onClose, onSuccess }: AddDialogProps) {
  const f = useAddForm<CreateLabourInput>(createLabourSchema, {} as DefaultValues<CreateLabourInput>);
  const submit = async (values: CreateLabourInput) => {
    f.setServerError(null);
    try {
      await addLabour(partId, values);
      f.reset({} as DefaultValues<CreateLabourInput>);
      toast.success('Saved');
      onSuccess();
      onClose();
    } catch (err) {
      f.setServerError(apiErrorMessage(err));
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add labour entry">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Operation" error={f.formState.errors.operation?.message}>
            <Input placeholder="CNC Turning" {...f.register('operation')} />
          </FormField>
          <FormField label="Grade" error={f.formState.errors.grade?.message}>
            <Input placeholder="Operator-A" {...f.register('grade')} />
          </FormField>
          <FormField label="Rate / hr" error={f.formState.errors.ratePerHr?.message}>
            <Input type="number" step="0.01" {...f.register('ratePerHr')} />
          </FormField>
          <FormField label="Std time (min)" error={f.formState.errors.stdTimeMin?.message}>
            <Input type="number" step="0.01" {...f.register('stdTimeMin')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Actions submitting={f.formState.isSubmitting} label="Add labour" onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Add Operation (COSTING) ──
export function AddOperationDialog({ partId, open, onClose, onSuccess }: AddDialogProps) {
  const f = useAddForm<CreateOperationInput>(createOperationSchema, {
    setupMin: 0,
    cycleMin: 0,
  } as DefaultValues<CreateOperationInput>);
  const submit = async (values: CreateOperationInput) => {
    f.setServerError(null);
    try {
      await addOperation(partId, values);
      f.reset({ setupMin: 0, cycleMin: 0 } as DefaultValues<CreateOperationInput>);
      toast.success('Saved');
      onSuccess();
      onClose();
    } catch (err) {
      f.setServerError(apiErrorMessage(err));
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add operation">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Sequence" error={f.formState.errors.seq?.message}>
            <Input type="number" placeholder="10" {...f.register('seq')} />
          </FormField>
          <FormField label="Operation" error={f.formState.errors.operation?.message}>
            <Input placeholder="Rough + Finish Turn" {...f.register('operation')} />
          </FormField>
          <FormField label="Machine" error={f.formState.errors.machine?.message}>
            <Input placeholder="CNC-LT-02" {...f.register('machine')} />
          </FormField>
          <FormField label="Tooling" error={f.formState.errors.tooling?.message}>
            <Input placeholder="DNMG 150608" {...f.register('tooling')} />
          </FormField>
          <FormField label="Setup (min)" error={f.formState.errors.setupMin?.message}>
            <Input type="number" step="0.01" {...f.register('setupMin')} />
          </FormField>
          <FormField label="Cycle (min)" error={f.formState.errors.cycleMin?.message}>
            <Input type="number" step="0.01" {...f.register('cycleMin')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Actions submitting={f.formState.isSubmitting} label="Add operation" onClose={onClose} />
      </form>
    </Dialog>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{children}</div>;
}
