import { useState, type ReactNode } from 'react';
import { useForm, type DefaultValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCycleTimeSchema,
  createFaiSchema,
  createFopaSchema,
  createLotSchema,
  createPdcaSchema,
  createPriceChangeSchema,
  createQualityRecordSchema,
  type CreateCycleTimeInput,
  type CreateFaiInput,
  type CreateFopaInput,
  type CreateLotInput,
  type CreatePdcaInput,
  type CreatePriceChangeInput,
  type CreateQualityRecordInput,
} from '@caliper/shared';
import { apiErrorMessage } from '@/lib/api';
import { createCycleTime } from '@/lib/partsApi';
import { createPrice } from '@/lib/pricingApi';
import { addFai, addFopa, addPdca, addPilotLot, addProductionLot, addQuality } from '@/lib/qualityApi';
import { toast } from '@/store/toast';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  partId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function useAddForm<T extends Record<string, unknown>>(
  schema: Parameters<typeof zodResolver>[0],
  defaults: DefaultValues<T>,
) {
  const form = useForm<T>({ resolver: zodResolver(schema) as Resolver<T>, defaultValues: defaults });
  const [serverError, setServerError] = useState<string | null>(null);
  return { ...form, serverError, setServerError, defaults };
}

function Footer({ submitting, onClose }: { submitting: boolean; onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

function Err({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">{children}</div>;
}

function makeSubmit<T>(
  f: { setServerError: (s: string | null) => void; reset: (d?: DefaultValues<T>) => void; defaults: DefaultValues<T> },
  call: (v: T) => Promise<unknown>,
  onSuccess: () => void,
  onClose: () => void,
  okMsg: string,
) {
  return async (values: T) => {
    f.setServerError(null);
    try {
      await call(values);
      f.reset(f.defaults);
      toast.success(okMsg);
      onSuccess();
      onClose();
    } catch (err) {
      f.setServerError(apiErrorMessage(err));
    }
  };
}

// ── Price (SALES) ──
export function AddPriceDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreatePriceChangeInput>(createPriceChangeSchema, {
    type: 'REVISION',
    effectiveDate: today(),
  } as DefaultValues<CreatePriceChangeInput>);
  const submit = makeSubmit<CreatePriceChangeInput>(f, (v) => createPrice(partId, v), onSuccess, onClose, 'Price change recorded');
  return (
    <Dialog open={open} onClose={onClose} title="Record price change" description="Captured in the audit trail.">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="New price" error={f.formState.errors.newPrice?.message}>
            <Input type="number" step="0.01" {...f.register('newPrice')} />
          </FormField>
          <FormField label="Type" error={f.formState.errors.type?.message}>
            <Select className="w-full" {...f.register('type')}>
              <option value="NEW">New</option>
              <option value="REVISION">Revision</option>
              <option value="PVC">PVC</option>
            </Select>
          </FormField>
          <FormField label="Effective date" error={f.formState.errors.effectiveDate?.message}>
            <Input type="date" {...f.register('effectiveDate')} />
          </FormField>
          <FormField label="Reason" error={f.formState.errors.reason?.message}>
            <Input placeholder="Steel index PVC Q3" {...f.register('reason')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Cycle time (COSTING) ──
export function AddCycleTimeDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreateCycleTimeInput>(createCycleTimeSchema, { date: today() } as DefaultValues<CreateCycleTimeInput>);
  const submit = makeSubmit<CreateCycleTimeInput>(f, (v) => createCycleTime(partId, v), onSuccess, onClose, 'Cycle-time revision added');
  return (
    <Dialog open={open} onClose={onClose} title="New cycle-time revision" description="Captured in the audit trail.">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cycle (min)" error={f.formState.errors.cycleMin?.message}>
            <Input type="number" step="0.01" {...f.register('cycleMin')} />
          </FormField>
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
        </div>
        <FormField label="Reason" error={f.formState.errors.reason?.message}>
          <Input placeholder="Tooling optimisation" {...f.register('reason')} />
        </FormField>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Quality record (QUALITY) ──
export function AddQualityDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreateQualityRecordInput>(createQualityRecordSchema, {
    date: today(),
    type: 'INSPECTION',
  } as DefaultValues<CreateQualityRecordInput>);
  const submit = makeSubmit<CreateQualityRecordInput>(f, (v) => addQuality(partId, v), onSuccess, onClose, 'Quality record added');
  return (
    <Dialog open={open} onClose={onClose} title="Add quality record" description="Captured in the audit trail.">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="Type" error={f.formState.errors.type?.message}>
            <Select className="w-full" {...f.register('type')}>
              <option value="INSPECTION">Inspection</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="FAI">FAI</option>
              <option value="AUDIT">Audit</option>
            </Select>
          </FormField>
          <FormField label="Result" error={f.formState.errors.result?.message}>
            <Input placeholder="OK / NOK" {...f.register('result')} />
          </FormField>
          <FormField label="PPM" error={f.formState.errors.ppm?.message}>
            <Input type="number" {...f.register('ppm')} />
          </FormField>
        </div>
        <FormField label="Defect" error={f.formState.errors.defect?.message}>
          <Input placeholder="Surface finish" {...f.register('defect')} />
        </FormField>
        <FormField label="Remarks" error={f.formState.errors.remarks?.message}>
          <Input {...f.register('remarks')} />
        </FormField>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── FAI (QUALITY) ──
export function AddFaiDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreateFaiInput>(createFaiSchema, { date: today(), result: 'PASS' } as DefaultValues<CreateFaiInput>);
  const submit = makeSubmit<CreateFaiInput>(f, (v) => addFai(partId, v), onSuccess, onClose, 'FAI added');
  return (
    <Dialog open={open} onClose={onClose} title="Add FAI record">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="FAI number" error={f.formState.errors.faiNo?.message}>
            <Input placeholder="FAI-CLP-1001" {...f.register('faiNo')} />
          </FormField>
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="Qty inspected" error={f.formState.errors.qtyInspected?.message}>
            <Input type="number" {...f.register('qtyInspected')} />
          </FormField>
          <FormField label="Result" error={f.formState.errors.result?.message}>
            <Select className="w-full" {...f.register('result')}>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </Select>
          </FormField>
          <FormField label="Inspector" error={f.formState.errors.inspector?.message}>
            <Input {...f.register('inspector')} />
          </FormField>
        </div>
        <FormField label="Remarks" error={f.formState.errors.remarks?.message}>
          <Input {...f.register('remarks')} />
        </FormField>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── Lot (QUALITY) — pilot or production ──
export function AddLotDialog({ partId, open, onClose, onSuccess, kind }: Props & { kind: 'pilot' | 'production' }) {
  const f = useAddForm<CreateLotInput>(createLotSchema, { date: today(), accepted: 0, rejected: 0 } as DefaultValues<CreateLotInput>);
  const call = (v: CreateLotInput) => (kind === 'pilot' ? addPilotLot(partId, v) : addProductionLot(partId, v));
  const submit = makeSubmit<CreateLotInput>(f, call, onSuccess, onClose, `${kind === 'pilot' ? 'Pilot' : 'Production'} lot added`);
  return (
    <Dialog open={open} onClose={onClose} title={`Add ${kind} lot`}>
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Lot number" error={f.formState.errors.lotNo?.message}>
            <Input placeholder="PRD-CLP-1001-A" {...f.register('lotNo')} />
          </FormField>
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="Qty" error={f.formState.errors.qty?.message}>
            <Input type="number" {...f.register('qty')} />
          </FormField>
          <FormField label="Accepted" error={f.formState.errors.accepted?.message}>
            <Input type="number" {...f.register('accepted')} />
          </FormField>
          <FormField label="Rejected" error={f.formState.errors.rejected?.message}>
            <Input type="number" {...f.register('rejected')} />
          </FormField>
        </div>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── FOPA (QUALITY) ──
export function AddFopaDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreateFopaInput>(createFopaSchema, { date: today(), result: 'APPROVED' } as DefaultValues<CreateFopaInput>);
  const submit = makeSubmit<CreateFopaInput>(f, (v) => addFopa(partId, v), onSuccess, onClose, 'FOPA added');
  return (
    <Dialog open={open} onClose={onClose} title="Add FOPA record">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="FOPA number" error={f.formState.errors.fopaNo?.message}>
            <Input placeholder="FOPA-CLP-1001" {...f.register('fopaNo')} />
          </FormField>
          <FormField label="Date" error={f.formState.errors.date?.message}>
            <Input type="date" {...f.register('date')} />
          </FormField>
          <FormField label="Result" error={f.formState.errors.result?.message}>
            <Select className="w-full" {...f.register('result')}>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONDITIONAL">Conditional</option>
            </Select>
          </FormField>
          <FormField label="Characteristic" error={f.formState.errors.characteristic?.message}>
            <Input placeholder="Critical bore Ø" {...f.register('characteristic')} />
          </FormField>
        </div>
        <FormField label="Remarks" error={f.formState.errors.remarks?.message}>
          <Input {...f.register('remarks')} />
        </FormField>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}

// ── PDCA (QUALITY) ──
export function AddPdcaDialog({ partId, open, onClose, onSuccess }: Props) {
  const f = useAddForm<CreatePdcaInput>(createPdcaSchema, { stage: 'PLAN', status: 'OPEN' } as DefaultValues<CreatePdcaInput>);
  const submit = makeSubmit<CreatePdcaInput>(f, (v) => addPdca(partId, v), onSuccess, onClose, 'PDCA item added');
  return (
    <Dialog open={open} onClose={onClose} title="Add PDCA item">
      <form className="space-y-3" onSubmit={f.handleSubmit(submit)} noValidate>
        <FormField label="Title" error={f.formState.errors.title?.message}>
          <Input placeholder="Reduce cycle time 10%" {...f.register('title')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Stage" error={f.formState.errors.stage?.message}>
            <Select className="w-full" {...f.register('stage')}>
              <option value="PLAN">Plan</option>
              <option value="DO">Do</option>
              <option value="CHECK">Check</option>
              <option value="ACT">Act</option>
            </Select>
          </FormField>
          <FormField label="Status" error={f.formState.errors.status?.message}>
            <Select className="w-full" {...f.register('status')}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </FormField>
          <FormField label="Owner" error={f.formState.errors.owner?.message}>
            <Input {...f.register('owner')} />
          </FormField>
          <FormField label="Target date" error={f.formState.errors.targetDate?.message}>
            <Input type="date" {...f.register('targetDate')} />
          </FormField>
        </div>
        <FormField label="Issue" error={f.formState.errors.issue?.message}>
          <Input {...f.register('issue')} />
        </FormField>
        <FormField label="Action" error={f.formState.errors.action?.message}>
          <Input {...f.register('action')} />
        </FormField>
        {f.serverError && <Err>{f.serverError}</Err>}
        <Footer submitting={f.formState.isSubmitting} onClose={onClose} />
      </form>
    </Dialog>
  );
}
