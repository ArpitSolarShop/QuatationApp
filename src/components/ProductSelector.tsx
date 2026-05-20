import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import { useState } from 'react';


export const SupplierTabs = [
  {
    id: 'tata',
    label: 'Tata On-Grid',
    description: '560wp Modules',
    color: '#FF6B35',
  },
  {
    id: 'waaree-topcon',
    label: 'Waaree TOPCON',
    description: '580/600wp TOPCON',
    color: '#004E89',
  },
  {
    id: 'adani-topcon',
    label: 'Adani TOPCON',
    description: '580/600wp TOPCON',
    color: '#0066CC',
  },
  {
    id: 'premier-topcon',
    label: 'Premier TOPCON',
    description: '580/600wp TOPCON',
    color: '#2E8B57',
  },
  {
    id: 'waaree-dcr',
    label: 'Hybrid DCR',
    description: 'With Battery',
    color: '#8338EC',
  },
  {
    id: 'waaree-dcr-nobattery',
    label: 'Hybrid DCR',
    description: 'Without Battery',
    color: '#7B2CBF',
  },
  {
    id: 'waaree-ndcr',
    label: 'Hybrid N-DCR',
    description: 'With Battery',
    color: '#F72585',
  },
  {
    id: 'waaree-ndcr-nobattery',
    label: 'Hybrid N-DCR',
    description: 'Without Battery',
    color: '#E61E63',
  },
  {
    id: 'integrated',
    label: 'Integrated',
    description: 'Integrated system packages',
    color: '#0B6E4F',
  },
];

export default function ProductSelector() {
  const [activeSupplier, setActiveSupplier] = useState<string>('tata');

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          🔧 Select Product Type
        </Typography>

        <Grid container spacing={2}>
          {SupplierTabs.map((supplier) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={supplier.id}>
              <Paper
                onClick={() => setActiveSupplier(supplier.id)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: activeSupplier === supplier.id ? `3px solid ${supplier.color}` : '2px solid #e0e0e0',
                  backgroundColor: activeSupplier === supplier.id ? `${supplier.color}15` : '#fff',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    color: supplier.color,
                    mb: 0.5,
                  }}
                >
                  {supplier.label}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {supplier.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* View All Products Button */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            href="/catalog"
            variant="outlined"
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            📋 View Complete Product Catalog
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
