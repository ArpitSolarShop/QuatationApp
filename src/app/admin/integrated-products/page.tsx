'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import IntegratedProductForm from '@/components/IntegratedProductForm';

export default function AdminIntegratedProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrated-products');
      const json = await res.json();
      if (json?.success) setItems(json.data ?? []);
      else setError(json?.message ?? 'Failed to load products');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Admin — Integrated Products</Typography>

      <IntegratedProductForm onSaved={() => fetchItems()} />

      <Typography variant="h6" sx={{ mt: 2 }}>Saved products</Typography> 

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      {!loading && !error && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>System (kW)</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Module (W)</TableCell>
                <TableCell>Modules</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.id}</TableCell>
                  <TableCell>{it.brand}</TableCell>
                  <TableCell>{it.system_kw}</TableCell>
                  <TableCell>{it.price}</TableCell>
                  <TableCell>{it.module_watt}</TableCell>
                  <TableCell>{it.no_of_modules}</TableCell>
                  <TableCell>{it.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
