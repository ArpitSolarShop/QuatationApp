'use client';

import React, { useState } from 'react';
import { integratedProductSchema, type IntegratedProductInput } from '../lib/schemas/integratedProduct';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Box, Alert } from '@mui/material';

export default function IntegratedProductForm({ onSaved }: { onSaved?: (item?: any) => void }) {
  const [form, setForm] = useState<Partial<IntegratedProductInput>>({
    brand: '',
    system_kw: undefined,
    phase: 'Single',
    price: undefined,
    inverter_capacity_kw: undefined,
    module_watt: undefined,
    module_type: 'TopCon',
    no_of_modules: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function update<K extends keyof IntegratedProductInput>(key: K, value: any) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      // Validate with Zod
      const parsed = integratedProductSchema.parse({
        brand: form.brand,
        system_kw: typeof form.system_kw === 'string' ? parseFloat(form.system_kw as any) : form.system_kw,
        phase: form.phase,
        price: typeof form.price === 'string' ? parseFloat(form.price as any) : form.price,
        inverter_capacity_kw: typeof form.inverter_capacity_kw === 'string' ? parseFloat(form.inverter_capacity_kw as any) : form.inverter_capacity_kw,
        module_watt: typeof form.module_watt === 'string' ? parseInt(form.module_watt as any, 10) : form.module_watt,
        module_type: form.module_type,
        no_of_modules: typeof form.no_of_modules === 'string' ? parseInt(form.no_of_modules as any, 10) : form.no_of_modules,
      });

      setLoading(true);
      const res = await fetch('/api/integrated-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage({ type: 'error', text: json.message || 'Failed to save product' });
      } else {
        setMessage({ type: 'success', text: 'Product saved successfully' });
        setForm({ brand: '', system_kw: undefined, phase: 'Single', price: undefined, inverter_capacity_kw: undefined, module_watt: undefined, module_type: 'TopCon', no_of_modules: undefined });
        // Notify parent to refresh the list
        try { if (onSaved) onSaved(json.data ?? null); } catch {}
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error)?.message || 'Validation failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2, maxWidth: 720 }}>
      {message && <Alert severity={message.type}>{message.text}</Alert>}

      <TextField required label="Brand" value={form.brand ?? ''} onChange={(e) => update('brand', e.target.value)} />

      <TextField required label="System (kW)" type="number" inputProps={{ step: 0.01 }} value={form.system_kw ?? ''} onChange={(e) => update('system_kw', e.target.value)} />

      <FormControl>
        <InputLabel id="phase-label">Phase</InputLabel>
        <Select labelId="phase-label" value={form.phase ?? 'Single'} label="Phase" onChange={(e) => update('phase', e.target.value)}>
          <MenuItem value="Single">Single</MenuItem>
          <MenuItem value="Three">Three</MenuItem>
        </Select>
      </FormControl>

      <TextField required label="Price" type="number" inputProps={{ step: 0.01 }} value={form.price ?? ''} onChange={(e) => update('price', e.target.value)} />

      <TextField required label="Inverter Capacity (kW)" type="number" inputProps={{ step: 0.01 }} value={form.inverter_capacity_kw ?? ''} onChange={(e) => update('inverter_capacity_kw', e.target.value)} />

      <TextField required label="Module Watt" type="number" value={form.module_watt ?? ''} onChange={(e) => update('module_watt', e.target.value)} />

      <TextField label="Module Type" value={form.module_type ?? 'TopCon'} onChange={(e) => update('module_type', e.target.value)} />

      <TextField required label="No of Modules" type="number" value={form.no_of_modules ?? ''} onChange={(e) => update('no_of_modules', e.target.value)} />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" type="submit" disabled={loading}>
          Save
        </Button>
        <Button variant="outlined" type="button" onClick={() => setForm({ brand: '', system_kw: undefined, phase: 'Single', price: undefined, inverter_capacity_kw: undefined, module_watt: undefined, module_type: 'TopCon', no_of_modules: undefined })}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
