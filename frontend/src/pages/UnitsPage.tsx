import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Tooltip as MuiTooltip,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { Tune as OptimizeIcon, Refresh as RefreshIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '@/services/api';
import { Unit, UnitStatus, PricingUrgency, UnitGridRow } from '@/types/api';
import { usePropertySelection } from '@/contexts/PropertySelectionContext';
import OptimizationModal from '@/components/OptimizationModal';
import BatchOptimizationDialog from '@/components/BatchOptimizationDialog';
import PropertySelector from '@/components/PropertySelector';

const UnitsPage: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [needsPricingOnly, setNeedsPricingOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [propertySelectorOpen, setPropertySelectorOpen] = useState(false);
  
  // Get selected properties from context
  const { selectedProperties } = usePropertySelection();

  // Fetch units with property filtering
  const {
    data: unitsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['units', page + 1, pageSize, statusFilter, needsPricingOnly, selectedProperties],
    queryFn: () =>
      apiService.getUnits({
        page: page + 1,
        page_size: pageSize,
        status: statusFilter as UnitStatus,
        selectedProperties: selectedProperties.length > 0 ? selectedProperties : undefined,
        needs_pricing_only: needsPricingOnly,
      }),
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🏠 Units Page - Selected properties:', selectedProperties);
    console.log('📊 Units data:', unitsData);
  }, [selectedProperties, unitsData]);

  // Transform units for DataGrid
  const rows: UnitGridRow[] =
    unitsData?.units.map((unit) => ({
      ...unit,
      id: unit.unit_id,
    })) || [];

  const handleRowClick = (params: GridRowParams) => {
    const unit = unitsData?.units.find((u) => u.unit_id === params.row.unit_id);
    if (unit) {
      setSelectedUnit(unit);
      setOptimizationModalOpen(true);
    }
  };

  const getStatusColor = (status: UnitStatus) => {
    switch (status) {
      case UnitStatus.VACANT:
        return 'error';
      case UnitStatus.OCCUPIED:
        return 'success';
      case UnitStatus.NOTICE:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getUrgencyColor = (urgency: PricingUrgency) => {
    switch (urgency) {
      case PricingUrgency.IMMEDIATE:
        return 'error';
      case PricingUrgency.HIGH:
        return 'warning';
      case PricingUrgency.MEDIUM:
        return 'info';
      case PricingUrgency.LOW:
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'unit_id',
      headerName: 'Unit ID',
      width: 120,
    },
    {
      field: 'property',
      headerName: 'Property',
      width: 150,
    },
    {
      field: 'unit_type',
      headerName: 'Type',
      width: 80,
    },
    {
      field: 'sqft',
      headerName: 'Sqft',
      width: 80,
      type: 'number',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value as UnitStatus)}
          size="small"
        />
      ),
    },
    {
      field: 'advertised_rent',
      headerName: 'Current Rent',
      width: 120,
      type: 'number',
      valueFormatter: (params) => (params.value ? `$${params.value.toLocaleString()}` : '-'),
    },
    {
      field: 'market_rent',
      headerName: 'Market Rent',
      width: 120,
      type: 'number',
      valueFormatter: (params) => (params.value ? `$${params.value.toLocaleString()}` : '-'),
    },
    {
      field: 'rent_per_sqft',
      headerName: '$/SqFt',
      width: 100,
      type: 'number',
      valueFormatter: (params) => (params.value ? `$${params.value.toFixed(2)}` : '-'),
    },
    {
      field: 'pricing_urgency',
      headerName: 'Urgency',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getUrgencyColor(params.value as PricingUrgency)}
          size="small"
        />
      ),
    },
    {
      field: 'needs_pricing',
      headerName: 'Needs Pricing',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'warning' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'days_to_lease_end',
      headerName: 'Days to Lease End',
      width: 140,
      type: 'number',
      valueFormatter: (value) => (value !== null ? value.toString() : '-'),
    },
    {
      field: 'annual_revenue_potential',
      headerName: 'Annual Revenue',
      width: 140,
      type: 'number',
      valueFormatter: (params) => (params.value ? `$${params.value.toLocaleString()}` : '-'),
    },
  ];

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading units: {error.message}</Typography>
        <Button onClick={() => refetch()} startIcon={<RefreshIcon />} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            Units
          </Typography>
          {/* Debug chip showing selected properties */}
          <Chip
            label={`${selectedProperties.length} properties selected`}
            size="small"
            sx={{
              mt: 1,
              backgroundColor: 'rgba(1, 209, 209, 0.1)',
              color: '#01D1D1',
              border: '1px solid rgba(1, 209, 209, 0.3)',
            }}
          />
        </Box>
        <Stack direction="row" spacing={2}>
          <MuiTooltip title={`${selectedProperties.length} properties selected`} arrow>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setPropertySelectorOpen(true)}
              sx={{
                color: '#01D1D1',
                borderColor: 'rgba(1, 209, 209, 0.3)',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                '&:hover': {
                  borderColor: '#01D1D1',
                  backgroundColor: 'rgba(1, 209, 209, 0.1)',
                },
              }}
            >
              Property Selector ({selectedProperties.length})
            </Button>
          </MuiTooltip>
          <Button
            variant="contained"
            startIcon={<OptimizeIcon />}
            onClick={() => setBatchDialogOpen(true)}
          >
            Batch Optimize
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={UnitStatus.VACANT}>Vacant</MenuItem>
              <MenuItem value={UnitStatus.OCCUPIED}>Occupied</MenuItem>
              <MenuItem value={UnitStatus.NOTICE}>Notice</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant={needsPricingOnly ? 'contained' : 'outlined'}
            onClick={() => setNeedsPricingOnly(!needsPricingOnly)}
          >
            Needs Pricing Only
          </Button>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        {isLoading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress 
              size={60} 
              sx={{
                color: '#01D1D1',
                filter: 'drop-shadow(0 0 8px rgba(1, 209, 209, 0.8))',
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textAlign: 'center',
              }}
            >
              Loading units...
            </Typography>
            {selectedProperties.length > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                From {selectedProperties.length} selected properties
              </Typography>
            )}
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            pagination
            paginationModel={{ page, pageSize }}
            rowCount={unitsData?.total_count || 0}
            paginationMode="server"
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            onRowClick={handleRowClick}
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              },
            }}
          />
        )}
      </Paper>

      {/* Optimization Modal */}
      <OptimizationModal
        unit={selectedUnit}
        open={optimizationModalOpen}
        onClose={() => {
          setOptimizationModalOpen(false);
          setSelectedUnit(null);
        }}
        onOptimize={(result) => {
          console.log('Optimization result:', result);
          // Optionally refetch data
          refetch();
        }}
      />

      {/* Batch Optimization Dialog */}
      <BatchOptimizationDialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onComplete={() => {
          console.log('Batch optimization completed');
          refetch();
        }}
      />

      {/* Property Selector Modal */}
      <PropertySelector open={propertySelectorOpen} onClose={() => setPropertySelectorOpen(false)} />
    </Box>
  );
};

export default UnitsPage; 