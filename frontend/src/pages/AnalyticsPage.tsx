import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  CompareArrows as CompareIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  LabelList,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type {
  SvSNBenchmarkResponse,
  SvSNVacancyResponse,
  SvSNRentSpreadResponse,
  SvSNClusteringResponse,
  SvSNRecommendationResponse,
} from '@/types/api';
import { usePropertySelection } from '@/contexts/PropertySelectionContext';

const COLORS = {
  nustyle: '#01D1D1',
  competition: '#6B7280',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [bedroomFilter, setBedroomFilter] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('Both');
  const [vacancyRange, setVacancyRange] = useState<number[]>([0, 90]);
  const [showOnlyOpportunities, setShowOnlyOpportunities] = useState(false);

  // Data fetching with React Query
  const { data: benchmarkData, isLoading: benchmarkLoading, error: benchmarkError } = useQuery({
    queryKey: ['svsn-benchmark', bedroomFilter],
    queryFn: () => apiService.getSvSNBenchmarkAnalysis(bedroomFilter || undefined),
  });

  const { data: vacancyData, isLoading: vacancyLoading } = useQuery({
    queryKey: ['svsn-vacancy', bedroomFilter],
    queryFn: () => apiService.getSvSNVacancyAnalysis(bedroomFilter || undefined),
  });

  const { data: rentSpreadData, isLoading: rentSpreadLoading } = useQuery({
    queryKey: ['svsn-rent-spread'],
    queryFn: () => apiService.getSvSNRentSpreadAnalysis(),
  });

  const { data: clusteringData, isLoading: clusteringLoading } = useQuery({
    queryKey: ['svsn-clustering', bedroomFilter],
    queryFn: () => apiService.getSvSNMarketRentClustering(bedroomFilter || undefined),
  });

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['svsn-recommendations'],
    queryFn: () => apiService.getSvSNOptimizationRecommendations(),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const prepareBenchmarkData = () => {
    if (!benchmarkData?.benchmark_data) return [];
    
    return benchmarkData.benchmark_data
      .filter(item => {
        if (propertyTypeFilter !== 'Both' && item.Property_Type !== propertyTypeFilter) return false;
        return true;
      })
      .map(item => ({
        property: item.Reporting_Property_Name,
        propertyType: item.Property_Type,
        bedrooms: item.Bedrooms,
        rent: item.avg_market_rent,
        psf: item.avg_market_rent_psf,
        sqft: item.avg_sq_ft,
        units: item.unit_count,
        fill: item.Property_Type === 'NuStyle' ? COLORS.nustyle : COLORS.competition,
      }))
      .sort((a, b) => b.rent - a.rent);
  };

  const prepareVacancyData = () => {
    if (!vacancyData?.vacancy_data) return [];
    
    return vacancyData.vacancy_data
      .filter(item => {
        if (propertyTypeFilter !== 'Both' && item.Property_Type !== propertyTypeFilter) return false;
        const vacancyDays = item.avg_days_vacant;
        return vacancyDays >= vacancyRange[0] && vacancyDays <= vacancyRange[1];
      })
      .map(item => ({
        property: item.Reporting_Property_Name,
        propertyType: item.Property_Type,
        bedrooms: item.Bedrooms,
        avgDaysVacant: item.avg_days_vacant,
        pctVacant30Plus: item.pct_vacant_30plus,
        totalUnits: item.total_units,
        unitsVacant30Plus: item.units_vacant_30plus,
        fill: item.Property_Type === 'NuStyle' ? COLORS.nustyle : COLORS.competition,
      }));
  };

  const prepareClusteringData = () => {
    if (!clusteringData?.clustering_data) return [];
    
    const clustered = clusteringData.clustering_data.reduce((acc: any, item) => {
      const key = `${item.rent_bucket}-${item.Bedrooms}`;
      if (!acc[key]) {
        acc[key] = {
          rentBucket: item.rent_bucket,
          bedrooms: item.Bedrooms,
          nustyleUnits: 0,
          competitionUnits: 0,
          nustyleVacancy: 0,
          competitionVacancy: 0,
        };
      }
      
      if (item.Property_Type === 'Nustyle') {
        acc[key].nustyleUnits = item.unit_count;
        acc[key].nustyleVacancy = item.avg_days_vacant;
      } else {
        acc[key].competitionUnits = item.unit_count;
        acc[key].competitionVacancy = item.avg_days_vacant;
      }
      
      return acc;
    }, {});
    
    return Object.values(clustered);
  };

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'HIGH_OPPORTUNITY': return COLORS.high;
      case 'MODERATE_OPPORTUNITY': return COLORS.medium;
      default: return COLORS.low;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return COLORS.high;
      case 'MEDIUM': return COLORS.medium;
      default: return COLORS.low;
    }
  };

  if (benchmarkLoading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (benchmarkError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading analytics data: {(benchmarkError as any)?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box 
        sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.05) 0%, rgba(42, 157, 143, 0.05) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(1, 209, 209, 0.3)',
              }}
            >
              <AnalyticsIcon sx={{ color: '#000', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 0.5,
                }}
              >
                NuStyle vs Competition Analytics
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}
              >
                Comprehensive competitive analysis and optimization insights
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Property Type</InputLabel>
              <Select
                value={propertyTypeFilter}
                label="Property Type"
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
              >
                <MenuItem value="Both">Both</MenuItem>
                <MenuItem value="NuStyle">NuStyle Only</MenuItem>
                <MenuItem value="Competition">Competition Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Bedroom Count</InputLabel>
              <Select
                value={bedroomFilter}
                label="Bedroom Count"
                onChange={(e) => setBedroomFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">1 Bedroom</MenuItem>
                <MenuItem value="2">2 Bedrooms</MenuItem>
                <MenuItem value="3">3 Bedrooms</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography gutterBottom>Vacancy Range (Days): {vacancyRange[0]} - {vacancyRange[1]}</Typography>
            <Slider
              value={vacancyRange}
              onChange={(e, newValue) => setVacancyRange(newValue as number[])}
              valueLabelDisplay="auto"
              min={0}
              max={365}
              size="small"
              sx={{ color: COLORS.nustyle }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyOpportunities}
                  onChange={(e) => setShowOnlyOpportunities(e.target.checked)}
                  sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.nustyle },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.nustyle },
                  }}
                />
              }
              label="Opportunities Only"
            />
          </Grid>
        </Grid>

        {/* Analytics Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            mt: 3,
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#01D1D1',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#01D1D1',
            }
          }}
        >
          <Tab icon={<CompareIcon />} label="Benchmark Analysis" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Vacancy Performance" iconPosition="start" />
          <Tab icon={<MoneyIcon />} label="Rent Spread Tracker" iconPosition="start" />
          <Tab icon={<AssessmentIcon />} label="Market Clustering" iconPosition="start" />
          <Tab icon={<HomeIcon />} label="Recommendations" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Market Rent Chart - Full Width, First */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Rent Comparison by Property
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {bedroomFilter !== 'All' ? `${bedroomFilter} bedroom units` : 'All bedroom types'} - 
                  <span style={{ color: COLORS.nustyle, fontWeight: 'bold' }}> ● NuStyle</span> vs 
                  <span style={{ color: COLORS.competition, fontWeight: 'bold' }}> ● Competition</span>
                </Typography>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={prepareBenchmarkData()} margin={{ bottom: 100, left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="property" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      fontSize={11}
                      interval={0}
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis tick={{ fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        name === 'rent' ? formatCurrency(value) : value,
                        name === 'rent' ? 'Market Rent' : name
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return `Property: ${label}${data ? ` (${data.units} units)` : ''}`;
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(42, 42, 48, 0.95)',
                        border: '1px solid rgba(1, 209, 209, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      labelStyle={{
                        color: '#ffffff'
                      }}
                      itemStyle={{
                        color: '#ffffff'
                      }}
                    />
                    <Bar 
                      dataKey="rent" 
                      name="Market Rent"
                      fill="#8884d8"
                    >
                      {prepareBenchmarkData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="units" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Rent Per Square Foot Chart - Full Width, Second */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rent Per Square Foot Comparison by Property
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: COLORS.nustyle, fontWeight: 'bold' }}> ● NuStyle</span> vs 
                  <span style={{ color: COLORS.competition, fontWeight: 'bold' }}> ● Competition</span>
                </Typography>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={prepareBenchmarkData().sort((a: any, b: any) => b.psf - a.psf)} margin={{ bottom: 100, left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="property" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      fontSize={11}
                      interval={0}
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis tick={{ fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        name === 'psf' ? `$${value.toFixed(2)}/sqft` : value,
                        name === 'psf' ? 'Rent Per Sq Ft' : name
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return `Property: ${label}${data ? ` (${data.units} units)` : ''}`;
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(42, 42, 48, 0.95)',
                        border: '1px solid rgba(1, 209, 209, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      labelStyle={{
                        color: '#ffffff'
                      }}
                      itemStyle={{
                        color: '#ffffff'
                      }}
                    />
                    <Bar 
                      dataKey="psf" 
                      name="Rent Per Sq Ft"
                      fill="#8884d8"
                    >
                      {prepareBenchmarkData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="units" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Benchmark Summary
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Property</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Bedrooms</TableCell>
                        <TableCell align="right">Units</TableCell>
                        <TableCell align="right">Avg Rent</TableCell>
                        <TableCell align="right">Rent PSF</TableCell>
                        <TableCell align="right">Avg Sq Ft</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prepareBenchmarkData().map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.property}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.propertyType}
                              size="small"
                              sx={{ 
                                backgroundColor: row.propertyType === 'NuStyle' ? COLORS.nustyle : COLORS.competition,
                                color: '#000',
                              }}
                            />
                          </TableCell>
                          <TableCell>{row.bedrooms}</TableCell>
                          <TableCell align="right">{row.units}</TableCell>
                          <TableCell align="right">{formatCurrency(row.rent)}</TableCell>
                          <TableCell align="right">${row.psf?.toFixed(2)}</TableCell>
                          <TableCell align="right">{row.sqft?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {/* Vacancy Performance Charts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Days Vacant by Property
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={prepareVacancyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="property" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis tick={{ fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        `${value} days`,
                        'Avg Days Vacant'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return `Property: ${label}${data ? ` (${data.totalUnits} units)` : ''}`;
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(42, 42, 48, 0.95)',
                        border: '1px solid rgba(1, 209, 209, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      labelStyle={{
                        color: '#ffffff'
                      }}
                      itemStyle={{
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="avgDaysVacant" name="Avg Days Vacant">
                      {prepareVacancyData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="totalUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  % Units Vacant 30+ Days
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={prepareVacancyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="property" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis tick={{ fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        `${value}%`,
                        '% Vacant 30+ Days'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return `Property: ${label}${data ? ` (${data.unitsVacant30Plus} of ${data.totalUnits} units)` : ''}`;
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(42, 42, 48, 0.95)',
                        border: '1px solid rgba(1, 209, 209, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      labelStyle={{
                        color: '#ffffff'
                      }}
                      itemStyle={{
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="pctVacant30Plus" name="% Vacant 30+ Days">
                      {prepareVacancyData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="totalUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {/* Rent Spread Summary */}
          {rentSpreadData?.summary && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ color: COLORS.high, fontWeight: 'bold' }}>
                        {rentSpreadData.summary.high_opportunity_units}
                      </Typography>
                      <Typography variant="body2">High Opportunity Units</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ color: COLORS.medium, fontWeight: 'bold' }}>
                        {rentSpreadData.summary.moderate_opportunity_units}
                      </Typography>
                      <Typography variant="body2">Moderate Opportunity Units</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.1) 0%, rgba(1, 209, 209, 0.05) 100%)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ color: COLORS.nustyle, fontWeight: 'bold' }}>
                        {formatCurrency(rentSpreadData.summary.total_monthly_potential)}
                      </Typography>
                      <Typography variant="body2">Monthly Potential</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ color: COLORS.low, fontWeight: 'bold' }}>
                        {formatCurrency(rentSpreadData.summary.total_annual_potential)}
                      </Typography>
                      <Typography variant="body2">Annual Potential</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Rent Spread Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  NuStyle Rent Spread Analysis (Advertised vs Market)
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Unit</TableCell>
                        <TableCell>Bedrooms</TableCell>
                        <TableCell align="right">Market Rent</TableCell>
                        <TableCell align="right">Advertised Rent</TableCell>
                        <TableCell align="right">% Below Market</TableCell>
                        <TableCell align="right">Days Vacant</TableCell>
                        <TableCell>Opportunity</TableCell>
                        <TableCell>Suggested Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rentSpreadData?.rent_spread_data
                        ?.filter(item => !showOnlyOpportunities || item.opportunity_level !== 'AT_MARKET')
                        ?.slice(0, 50)
                        ?.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.Unit}</TableCell>
                          <TableCell>{row.Bedrooms}</TableCell>
                          <TableCell align="right">{formatCurrency(row.Market_Rent)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.Advertised_Rent)}</TableCell>
                          <TableCell align="right">{row.pct_below_market}%</TableCell>
                          <TableCell align="right">{row.Days_Vacant}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.opportunity_level.replace('_', ' ')}
                              size="small"
                              sx={{ 
                                backgroundColor: getOpportunityColor(row.opportunity_level),
                                color: '#fff',
                              }}
                            />
                          </TableCell>
                          <TableCell>{row.suggested_action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          {/* Market Rent Clustering Heatmap */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Rent Clustering Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={prepareClusteringData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="rentBucket" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis tick={{ fill: '#ffffff' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(42, 42, 48, 0.95)',
                        border: '1px solid rgba(1, 209, 209, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value: any, name: string) => [
                        `${value} units`,
                        name
                      ]}
                      labelStyle={{
                        color: '#ffffff'
                      }}
                      itemStyle={{
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="nustyleUnits" fill={COLORS.nustyle} name="NuStyle Units">
                      <LabelList dataKey="nustyleUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                    <Bar dataKey="competitionUnits" fill={COLORS.competition} name="Competition Units">
                      <LabelList dataKey="competitionUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          {/* Optimization Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Recommendations for NuStyle Units
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Unit</TableCell>
                        <TableCell>Bedrooms</TableCell>
                        <TableCell align="right">Market Rent</TableCell>
                        <TableCell align="right">Advertised Rent</TableCell>
                        <TableCell align="right">Days Vacant</TableCell>
                        <TableCell align="right">Rent Gap</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Suggested Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recommendationsData?.recommendations?.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.Unit}</TableCell>
                          <TableCell>{row.Bedrooms}</TableCell>
                          <TableCell align="right">{formatCurrency(row.Market_Rent)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.Advertised_Rent)}</TableCell>
                          <TableCell align="right">{row.Days_Vacant}</TableCell>
                          <TableCell align="right">{formatCurrency(row.rent_gap)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.priority}
                              size="small"
                              sx={{ 
                                backgroundColor: getPriorityColor(row.priority),
                                color: '#fff',
                              }}
                            />
                          </TableCell>
                          <TableCell>{row.suggested_action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage; 