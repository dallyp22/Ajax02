import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiService } from '@/services/api';
import {
  OptimizationStrategy,
  OptimizeRequest,
  OptimizationResult,
  OptimizationModalProps,
} from '@/types/api';

const OptimizationModal: React.FC<OptimizationModalProps> = ({
  unit,
  open,
  onClose,
  onOptimize,
}) => {
  const [strategy, setStrategy] = useState<OptimizationStrategy>(OptimizationStrategy.REVENUE);
  const [weight, setWeight] = useState<number>(0.5);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showComparablesDetail, setShowComparablesDetail] = useState(false);

  // Fetch comparables for the unit
  const {
    data: comparablesData,
    isLoading: comparablesLoading,
  } = useQuery({
    queryKey: ['comparables', unit?.unit_id],
    queryFn: () => apiService.getUnitComparables(unit!.unit_id),
    enabled: !!unit?.unit_id,
  });

  // Optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: (request: OptimizeRequest) =>
      apiService.optimizeUnit(unit!.unit_id, request),
    onSuccess: (data) => {
      setOptimizationResult(data.optimization);
      onOptimize(data.optimization);
    },
  });

  const handleOptimize = () => {
    if (!unit) return;

    const request: OptimizeRequest = {
      strategy,
      ...(strategy === OptimizationStrategy.BALANCED && { weight }),
    };

    optimizeMutation.mutate(request);
  };

  const handleClose = () => {
    setOptimizationResult(null);
    onClose();
  };

  if (!unit) return null;

  // Prepare chart data
  const chartData = optimizationResult
    ? [
        {
          name: 'Current',
          value: optimizationResult.current_rent,
          fill: '#8884d8',
        },
        {
          name: 'Suggested',
          value: optimizationResult.suggested_rent,
          fill: optimizationResult.rent_change >= 0 ? '#82ca9d' : '#ff7c7c',
        },
        {
          name: 'Comp Avg',
          value: optimizationResult.comp_data.avg_comp_price || 0,
          fill: '#ffc658',
        },
      ]
    : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Optimize Unit {unit.unit_id} - {unit.property}
          </Typography>
          <Chip
            label={unit.status}
            color={unit.status === 'VACANT' ? 'error' : 'success'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Unit Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unit Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body1">{unit.unit_type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Size
                    </Typography>
                    <Typography variant="body1">{unit.sqft} sq ft</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Current Rent
                    </Typography>
                    <Typography variant="body1">
                      ${unit.advertised_rent.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Market Rent
                    </Typography>
                    <Typography variant="body1">
                      {unit.market_rent ? `$${unit.market_rent.toLocaleString()}` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Pricing Urgency
                    </Typography>
                    <Chip
                      label={unit.pricing_urgency}
                      color={
                        unit.pricing_urgency === 'IMMEDIATE'
                          ? 'error'
                          : unit.pricing_urgency === 'HIGH'
                          ? 'warning'
                          : 'default'
                      }
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Days to Lease End
                    </Typography>
                    <Typography variant="body1">
                      {unit.days_to_lease_end !== null ? unit.days_to_lease_end : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Comparables Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" gutterBottom>
                    Comparable Units
                  </Typography>
                  {comparablesData && comparablesData.comparables.length > 0 && (
                    <IconButton
                      onClick={() => setShowComparablesDetail(!showComparablesDetail)}
                      size="small"
                    >
                      {showComparablesDetail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </Box>
                {comparablesLoading ? (
                  <CircularProgress size={24} />
                ) : comparablesData ? (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Total Comps
                        </Typography>
                        <Typography variant="body1">{comparablesData.total_comps}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Avg Price
                        </Typography>
                        <Typography variant="body1">
                          ${comparablesData.avg_comp_price.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Median Price
                        </Typography>
                        <Typography variant="body1">
                          ${comparablesData.median_comp_price.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Price Range
                        </Typography>
                        <Typography variant="body1">
                          ${comparablesData.min_comp_price.toLocaleString()} - $
                          {comparablesData.max_comp_price.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Detailed Comparables View */}
                    <Collapse in={showComparablesDetail}>
                      <Box mt={2}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>
                          Individual Comparable Units ({comparablesData.comparables.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Property</TableCell>
                                <TableCell align="right">Sqft</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">$/Sqft</TableCell>
                                <TableCell align="right">Match</TableCell>
                                <TableCell align="center">Available</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {comparablesData.comparables.map((comp, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {comp.comp_property}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {comp.comp_id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2">
                                      {comp.comp_sqft.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {comp.sqft_delta_pct > 0 ? '+' : ''}{comp.sqft_delta_pct.toFixed(1)}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      ${comp.comp_price.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color={comp.price_gap_pct && comp.price_gap_pct < 0 ? 'error' : 'success'}>
                                      {comp.price_gap_pct ? `${comp.price_gap_pct > 0 ? '+' : ''}${comp.price_gap_pct.toFixed(1)}%` : 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2">
                                      ${(comp.comp_price / comp.comp_sqft).toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Chip
                                      label={`${(comp.similarity_score * 100).toFixed(0)}%`}
                                      size="small"
                                      color={comp.similarity_score >= 0.9 ? 'success' : 'default'}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={comp.is_available ? 'Yes' : 'No'}
                                      size="small"
                                      color={comp.is_available ? 'success' : 'default'}
                                      variant={comp.is_available ? 'filled' : 'outlined'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </>
                ) : (
                  <Typography color="textSecondary">No comparables found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Strategy */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Strategy
                </Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Strategy</InputLabel>
                      <Select
                        value={strategy}
                        label="Strategy"
                        onChange={(e) => setStrategy(e.target.value as OptimizationStrategy)}
                      >
                        <MenuItem value={OptimizationStrategy.REVENUE}>
                          Revenue Maximization
                        </MenuItem>
                        <MenuItem value={OptimizationStrategy.LEASE_UP}>
                          Lease-Up Time Minimization
                        </MenuItem>
                        <MenuItem value={OptimizationStrategy.BALANCED}>Balanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {strategy === OptimizationStrategy.BALANCED && (
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" gutterBottom>
                        Revenue vs Lease-Up Weight: {weight.toFixed(2)}
                      </Typography>
                      <Slider
                        value={weight}
                        onChange={(_, newValue) => setWeight(newValue as number)}
                        min={0}
                        max={1}
                        step={0.1}
                        marks={[
                          { value: 0, label: 'Lease-Up Focus' },
                          { value: 0.5, label: 'Balanced' },
                          { value: 1, label: 'Revenue Focus' },
                        ]}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Results */}
          {optimizationResult && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Optimization Results
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Suggested Rent
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${optimizationResult.suggested_rent.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Change
                          </Typography>
                          <Typography
                            variant="h6"
                            color={optimizationResult.rent_change >= 0 ? 'success.main' : 'error.main'}
                          >
                            {optimizationResult.rent_change >= 0 ? '+' : ''}$
                            {optimizationResult.rent_change.toLocaleString()} (
                            {optimizationResult.rent_change_pct.toFixed(1)}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Annual Impact
                          </Typography>
                          <Typography variant="body1">
                            {optimizationResult.revenue_impact_annual >= 0 ? '+' : ''}$
                            {optimizationResult.revenue_impact_annual.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Confidence
                          </Typography>
                          <Typography variant="body1">
                            {optimizationResult.confidence
                              ? `${(optimizationResult.confidence * 100).toFixed(1)}%`
                              : 'N/A'}
                          </Typography>
                        </Grid>
                        {optimizationResult.expected_days_to_lease && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Expected Days to Lease
                            </Typography>
                            <Typography variant="body1">
                              {optimizationResult.expected_days_to_lease} days
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Price Comparison
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                          <Bar dataKey="value">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Error Display */}
          {optimizeMutation.error && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error optimizing unit: {optimizeMutation.error.message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleOptimize}
          disabled={optimizeMutation.isPending}
          startIcon={optimizeMutation.isPending ? <CircularProgress size={20} /> : null}
        >
          {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Rent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptimizationModal; 