import React, { useState, useMemo } from 'react';
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip as MuiTooltip,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CompareArrows as CompareIcon,
  Analytics as AnalyticsIcon,
  BusinessCenter as PropertyIcon,
  Assessment as AssessmentIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
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
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { usePropertySelection } from '@/contexts/PropertySelectionContext';

const COLORS = ['#01D1D1', '#2A9D8F', '#F4A261', '#E76F51', '#8884D8', '#82CA9D', '#FFC658'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [showUnitDetails, setShowUnitDetails] = useState(false);
  const { selectedProperties } = usePropertySelection();

  // Fetch portfolio-wide data with property filtering
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio-analytics', selectedProperties],
    queryFn: () => apiService.getPortfolioAnalytics(selectedProperties.length > 0 ? selectedProperties : undefined),
  });

  const { data: marketData } = useQuery({
    queryKey: ['market-position', selectedProperties],
    queryFn: () => apiService.getMarketPosition(selectedProperties.length > 0 ? selectedProperties : undefined),
  });

  const { data: opportunitiesData } = useQuery({
    queryKey: ['pricing-opportunities', selectedProperties],
    queryFn: () => apiService.getPricingOpportunities(selectedProperties.length > 0 ? selectedProperties : undefined),
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🏢 Selected properties changed:', selectedProperties);
    console.log('📊 Portfolio data:', portfolioData);
  }, [selectedProperties, portfolioData]);

  // Fetch property list
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiService.getProperties(),
  });

  // Fetch property-specific data when property is selected
  const { data: propertyCompetitionData, isLoading: competitionLoading } = useQuery({
    queryKey: ['property-competition', selectedProperty],
    queryFn: () => apiService.getPropertyCompetitionAnalysis(selectedProperty),
    enabled: !!selectedProperty,
  });

  const { data: propertyUnitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['property-units', selectedProperty],
    queryFn: () => apiService.getPropertyUnitAnalysis(selectedProperty),
    enabled: !!selectedProperty,
  });

  const { data: propertyTrendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['property-trends', selectedProperty],
    queryFn: () => apiService.getPropertyMarketTrends(selectedProperty),
    enabled: !!selectedProperty,
  });

  if (portfolioLoading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (portfolioError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading dashboard data: {(portfolioError as any)?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  const portfolio = portfolioData?.portfolio_summary || {};
  const urgencyBreakdown = portfolioData?.vacancy_by_urgency || [];
  const propertyPerformance = portfolioData?.top_properties || [];
  const marketSummary = marketData?.market_summary || [];
  const opportunities = opportunitiesData?.summary || {};
  const properties = propertiesData?.properties || [];

  // Format functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value?.toFixed(1) || 0}%`;
  };

  // Chart data preparation
  const prepareRentComparisonData = () => {
    if (!propertyCompetitionData?.rent_comparison_by_bedrooms) return [];
    return propertyCompetitionData.rent_comparison_by_bedrooms.map(item => ({
      bedrooms: `${item.bed}BR`,
      ourRent: item.avg_our_rent,
      marketRent: item.avg_market_rent,
      gap: item.rent_gap_pct,
      unitCount: item.unit_count,
    }));
  };

  const prepareMarketPositioningData = () => {
    if (!propertyTrendsData?.market_positioning) return [];
    return propertyTrendsData.market_positioning.map(item => ({
      unitType: item.unit_type,
      beds: item.bed,
      ourRent: item.our_avg_rent,
      marketRent: item.market_avg_rent,
      ourRentPerSqft: item.our_avg_rent_per_sqft,
      marketRentPerSqft: item.market_avg_rent_per_sqft,
      premium: item.rent_premium_pct,
      unitCount: item.our_unit_count,
    }));
  };

  const prepareCompetitorData = () => {
    if (!propertyTrendsData?.top_competitors) return [];
    return propertyTrendsData.top_competitors.map(comp => ({
      name: comp.competitor_property.length > 20 
        ? comp.competitor_property.substring(0, 20) + '...' 
        : comp.competitor_property,
      fullName: comp.competitor_property,
      avgRent: comp.their_avg_rent,
      rentPerSqft: comp.their_avg_rent_per_sqft,
      similarityScore: comp.avg_similarity_score,
      availableUnits: comp.their_available_units,
      comparableUnits: comp.their_comparable_units,
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const isPropertySelected = !!selectedProperty;
  const propertyMetrics = propertyCompetitionData?.performance_metrics || {};

  return (
    <Box>
      {/* Enhanced Header Section */}
      <Box 
        sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.05) 0%, rgba(42, 157, 143, 0.05) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Debug info for property filtering */}
        {selectedProperties.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Filtered: ${selectedProperties.length} properties selected`}
              color="primary"
              size="small"
              sx={{
                backgroundColor: 'rgba(1, 209, 209, 0.2)',
                color: '#01D1D1',
                border: '1px solid rgba(1, 209, 209, 0.3)',
              }}
            />
          </Box>
        )}

        {/* Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={2}
        >
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
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                Competitive Intelligence Center
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  letterSpacing: '0.5px'
                }}
              >
                {isPropertySelected 
                  ? `Deep analysis for ${selectedProperty}`
                  : 'Portfolio-wide market intelligence and optimization insights'
                }
              </Typography>
            </Box>
          </Box>

          {/* Property Selector */}
          <Box sx={{ minWidth: 300 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Property for Deep Analysis</InputLabel>
              <Select
                value={selectedProperty}
                label="Select Property for Deep Analysis"
                onChange={(e) => setSelectedProperty(e.target.value)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(1, 209, 209, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#01D1D1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#01D1D1',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Portfolio Overview</em>
                </MenuItem>
                {properties.map((property) => (
                  <MenuItem key={property} value={property}>
                    {property}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Analysis Mode Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
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
          <Tab 
            icon={<AssessmentIcon />} 
            label="Portfolio Overview" 
            iconPosition="start"
            disabled={isPropertySelected}
          />
          <Tab 
            icon={<CompareIcon />} 
            label="Property vs Competition" 
            iconPosition="start"
            disabled={!isPropertySelected}
          />
          <Tab 
            icon={<PropertyIcon />} 
            label="Unit Analysis" 
            iconPosition="start"
            disabled={!isPropertySelected}
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            label="Market Trends" 
            iconPosition="start"
            disabled={!isPropertySelected}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {/* Portfolio Overview Content - Your existing portfolio analytics */}
        <Grid container spacing={3}>
          {/* Your existing KPI cards */}
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.1) 0%, rgba(42, 157, 143, 0.05) 100%)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>
                      TOTAL UNITS
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#01D1D1', mt: 1 }}>
                      {formatNumber(portfolio.total_units || 0)}
                    </Typography>
                  </Box>
                  <HomeIcon sx={{ fontSize: 48, color: '#01D1D1', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(42, 157, 143, 0.1) 0%, rgba(42, 157, 143, 0.05) 100%)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>
                      OCCUPANCY RATE
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#2A9D8F', mt: 1 }}>
                      {formatPercentage(portfolio.occupancy_rate || 0)}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#2A9D8F', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(42, 157, 143, 0.1) 0%, rgba(1, 209, 209, 0.05) 100%)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>
                      ANNUAL REVENUE
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2A9D8F', mt: 1, fontSize: '1.75rem' }}>
                      {formatCurrency(portfolio.estimated_annual_revenue || 0)}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 48, color: '#2A9D8F', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.1) 0%, rgba(244, 162, 97, 0.05) 100%)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>
                      REVENUE OPPORTUNITY
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#F4A261', mt: 1, fontSize: '1.5rem' }}>
                      {formatCurrency(opportunities.total_annual_opportunity || 0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, color: '#F4A261', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Occupancy Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unit Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: portfolio.occupied_units || 0, color: '#00C49F' },
                        { name: 'Vacant', value: portfolio.vacant_units || 0, color: '#FF8042' },
                        { name: 'Notice', value: portfolio.notice_units || 0, color: '#FFBB28' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index: number) => (
                        <Cell key={`cell-${index}`} fill={['#00C49F', '#FF8042', '#FFBB28'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Pricing Urgency */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pricing Urgency Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={urgencyBreakdown.map((item: any, index: number) => ({
                    name: item.urgency,
                    value: item.count,
                    fill: COLORS[index % COLORS.length]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.8)"
                      fontSize={12}
                      fontWeight={600}
                    />
                    <YAxis stroke="rgba(255, 255, 255, 0.8)" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {urgencyBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Market Position Analysis */}
          {marketSummary.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Position Analysis
                  </Typography>
                  <Box>
                    {marketSummary.map((item: any) => (
                      <Box key={item.market_position} mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">
                            {item.market_position.replace('_', ' ')} Market
                          </Typography>
                          <Chip
                            size="small"
                            label={`${item.unit_count} units`}
                            color={
                              item.market_position === 'ABOVE_MARKET'
                                ? 'success'
                                : item.market_position === 'BELOW_MARKET'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(item.unit_count / portfolio.total_units) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Avg Premium/Discount: {item.avg_premium_discount?.toFixed(1) || 0}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top Revenue Opportunities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Optimization Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color="success.main">
                        {opportunities.units_with_50plus_opportunity || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Units with $50+ opportunity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color="warning.main">
                        {opportunities.units_with_100plus_opportunity || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Units with $100+ opportunity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(opportunities.total_monthly_opportunity || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Monthly Revenue Opportunity
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Property Performance */}
          {propertyPerformance && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Property Performance
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell align="right">Total Units</TableCell>
                          <TableCell align="right">Occupied Units</TableCell>
                          <TableCell align="right">Avg Rent</TableCell>
                          <TableCell align="right">Occupancy Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {propertyPerformance.slice(0, 8).map((property: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {property.property}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{property.unit_count}</TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={property.occupied_count}
                                color="success"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(property.avg_rent)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={`${property.occupancy_rate}%`}
                                color={property.occupancy_rate >= 90 ? 'success' : property.occupancy_rate >= 80 ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Insights & Next Actions
                </Typography>
                <Grid container spacing={2}>
                  {portfolio.units_needing_pricing > 0 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity="warning" icon={<WarningIcon />}>
                        <Typography variant="subtitle2">
                          {portfolio.units_needing_pricing} units need pricing attention
                        </Typography>
                        <Typography variant="body2">
                          Focus on vacant units and leases expiring within 60 days
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  {opportunities.total_annual_opportunity > 50000 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity="success" icon={<TrendingUpIcon />}>
                        <Typography variant="subtitle2">
                          {formatCurrency(opportunities.total_annual_opportunity)} revenue opportunity
                        </Typography>
                        <Typography variant="body2">
                          Significant pricing optimization potential identified
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  {portfolio.occupancy_rate < 90 && (
                    <Grid item xs={12} md={4}>
                      <Alert severity="info" icon={<CompareIcon />}>
                        <Typography variant="subtitle2">
                          {(100 - portfolio.occupancy_rate).toFixed(1)}% vacancy rate
                        </Typography>
                        <Typography variant="body2">
                          Consider competitive pricing for vacant units
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {isPropertySelected && (
          <Grid container spacing={3}>
            {/* Rent Comparison by Bedrooms */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rent Comparison by Bedrooms
                  </Typography>
                  {competitionLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareRentComparisonData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bedrooms" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ourRent" fill="#2A9D8F" name="Our Rent" />
                        <Bar dataKey="marketRent" fill="#F4A261" name="Market Rent" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Market Positioning */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Positioning ($/SqFt)
                  </Typography>
                  {competitionLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareMarketPositioningData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="beds" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ourRentPerSqft" fill="#2A9D8F" name="Our $/SqFt" />
                        <Bar dataKey="marketRentPerSqft" fill="#F4A261" name="Market $/SqFt" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Competitors */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Competitors
                  </Typography>
                  {competitionLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Competitor</TableCell>
                            <TableCell align="right">Avg Rent</TableCell>
                            <TableCell align="right">Avg $/SqFt</TableCell>
                            <TableCell align="right">Similarity Score</TableCell>
                            <TableCell align="right">Available Units</TableCell>
                            <TableCell align="right">Comparable Units</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prepareCompetitorData().map((comp, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" noWrap>
                                  {comp.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{formatCurrency(comp.avgRent)}</TableCell>
                              <TableCell align="right">${comp.rentPerSqft?.toFixed(2)}</TableCell>
                              <TableCell align="right">{comp.similarityScore?.toFixed(1)}%</TableCell>
                              <TableCell align="right">{comp.availableUnits}</TableCell>
                              <TableCell align="right">{comp.comparableUnits}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        {!isPropertySelected && (
          <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="textSecondary">
              Select a property to view competitive analysis.
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {isPropertySelected && (
          <Grid container spacing={3}>
            {/* Unit Status Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Unit Status Distribution
                  </Typography>
                  {unitsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Vacant', value: propertyUnitsData?.units?.filter(u => u.status === 'VACANT').length || 0 },
                            { name: 'Occupied', value: propertyUnitsData?.units?.filter(u => u.status === 'OCCUPIED').length || 0 },
                            { name: 'Notice', value: propertyUnitsData?.units?.filter(u => u.status === 'NOTICE').length || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1, 2].map((index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Pricing Urgency */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pricing Urgency Breakdown
                  </Typography>
                  {unitsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'IMMEDIATE', value: propertyUnitsData?.units?.filter(u => u.pricing_urgency === 'IMMEDIATE').length || 0 },
                        { name: 'HIGH', value: propertyUnitsData?.units?.filter(u => u.pricing_urgency === 'HIGH').length || 0 },
                        { name: 'MEDIUM', value: propertyUnitsData?.units?.filter(u => u.pricing_urgency === 'MEDIUM').length || 0 },
                        { name: 'LOW', value: propertyUnitsData?.units?.filter(u => u.pricing_urgency === 'LOW').length || 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {[0, 1, 2, 3].map((index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Market Position Analysis */}
            {!unitsLoading && marketSummary.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Market Position Analysis
                    </Typography>
                    <Box>
                      {marketSummary.map((item: any) => (
                        <Box key={item.market_position} mb={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2">
                              {item.market_position.replace('_', ' ')} Market
                            </Typography>
                            <Chip
                              size="small"
                              label={`${item.unit_count} units`}
                              color={
                                item.market_position === 'ABOVE_MARKET'
                                  ? 'success'
                                  : item.market_position === 'BELOW_MARKET'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(item.unit_count / portfolio.total_units) * 100}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            Avg Premium/Discount: {item.avg_premium_discount?.toFixed(1) || 0}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Revenue Optimization Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Optimization Summary
                  </Typography>
                  {unitsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h3" color="success.main">
                            {propertyUnitsData?.summary?.units_50plus_below_market || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Units with $50+ opportunity
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h3" color="warning.main">
                            {propertyUnitsData?.summary?.units_100plus_below_market || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Units with $100+ opportunity
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(propertyUnitsData?.summary?.total_monthly_opportunity || 0)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Monthly Revenue Opportunity
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Unit-Level Analysis Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Unit-Level Competitive Analysis
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowUnitDetails(!showUnitDetails)}
                      endIcon={showUnitDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {showUnitDetails ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </Box>
                  {unitsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Unit ID</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell align="right">Current Rent</TableCell>
                              <TableCell align="right">Market Rent</TableCell>
                              <TableCell align="right">Gap</TableCell>
                              <TableCell align="right">Opportunity</TableCell>
                              <TableCell>Position</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {propertyUnitsData?.units?.slice(0, showUnitDetails ? 50 : 10).map((unit: any) => (
                              <TableRow key={unit.unit_id}>
                                <TableCell>{unit.unit_id}</TableCell>
                                <TableCell>{unit.unit_type}</TableCell>
                                <TableCell align="right">{formatCurrency(unit.advertised_rent)}</TableCell>
                                <TableCell align="right">{formatCurrency(unit.avg_comp_rent)}</TableCell>
                                <TableCell align="right">
                                  <Chip
                                    size="small"
                                    label={`${unit.rent_premium_pct?.toFixed(1) || 0}%`}
                                    color={unit.rent_premium_pct > 0 ? 'success' : 'warning'}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(unit.annual_opportunity || 0)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={unit.market_position}
                                    color={
                                      unit.market_position === 'ABOVE_MARKET' ? 'success' :
                                      unit.market_position === 'BELOW_MARKET' ? 'warning' : 'default'
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={unit.status}
                                    color={
                                      unit.status === 'VACANT' ? 'error' :
                                      unit.status === 'NOTICE' ? 'warning' : 'success'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {propertyUnitsData?.units && propertyUnitsData.units.length > 10 && !showUnitDetails && (
                        <Box textAlign="center" mt={2}>
                          <Typography variant="body2" color="textSecondary">
                            Showing 10 of {propertyUnitsData.units.length} units. Click "Show Details" to see all.
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Insights & Next Actions
                  </Typography>
                  <Grid container spacing={2}>
                    {propertyUnitsData?.summary?.units_50plus_below_market && propertyUnitsData.summary.units_50plus_below_market > 0 && (
                      <Grid item xs={12} md={4}>
                        <Alert severity="warning" icon={<WarningIcon />}>
                          <Typography variant="subtitle2">
                            {propertyUnitsData.summary.units_50plus_below_market} units need pricing attention
                          </Typography>
                          <Typography variant="body2">
                            Focus on vacant units and leases expiring within 60 days
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    {propertyUnitsData?.summary?.total_annual_opportunity && propertyUnitsData.summary.total_annual_opportunity > 50000 && (
                      <Grid item xs={12} md={4}>
                        <Alert severity="success" icon={<TrendingUpIcon />}>
                          <Typography variant="subtitle2">
                            {formatCurrency(propertyUnitsData.summary.total_annual_opportunity)} revenue opportunity
                          </Typography>
                          <Typography variant="body2">
                            Significant pricing optimization potential identified
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    {propertyMetrics && (propertyMetrics as any).occupancy_rate !== undefined && (propertyMetrics as any).occupancy_rate < 90 && (
                      <Grid item xs={12} md={4}>
                        <Alert severity="info" icon={<CompareIcon />}>
                          <Typography variant="subtitle2">
                            {(100 - (propertyMetrics as any).occupancy_rate).toFixed(1)}% vacancy rate
                          </Typography>
                          <Typography variant="body2">
                            Consider competitive pricing for vacant units
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        {!isPropertySelected && (
          <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="textSecondary">
              Select a property to view unit-level analysis.
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {isPropertySelected && (
          <Grid container spacing={3}>
            {/* Rent Distribution Analysis */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rent Distribution Analysis
                  </Typography>
                  {trendsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={propertyTrendsData?.rent_distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rent_range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="unit_count" fill="#2A9D8F" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Market Positioning by Unit Type */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Positioning by Unit Type
                  </Typography>
                  {trendsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={prepareMarketPositioningData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ourRent" name="Our Rent" />
                        <YAxis dataKey="marketRent" name="Market Rent" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Units" data={prepareMarketPositioningData()} fill="#01D1D1" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Competitive Landscape */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Competitive Landscape Analysis
                  </Typography>
                  {trendsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Competitor Property</TableCell>
                            <TableCell align="right">Our Units Compared</TableCell>
                            <TableCell align="right">Their Comparable Units</TableCell>
                            <TableCell align="right">Their Avg Rent</TableCell>
                            <TableCell align="right">Their Avg $/SqFt</TableCell>
                            <TableCell align="right">Similarity Score</TableCell>
                            <TableCell align="right">Their Available Units</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {propertyTrendsData?.top_competitors?.map((comp: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <MuiTooltip title={comp.competitor_property} arrow>
                                  <Typography variant="body2" noWrap>
                                    {comp.competitor_property.length > 30 
                                      ? comp.competitor_property.substring(0, 30) + '...' 
                                      : comp.competitor_property
                                    }
                                  </Typography>
                                </MuiTooltip>
                              </TableCell>
                              <TableCell align="right">{comp.our_units_compared}</TableCell>
                              <TableCell align="right">{comp.their_comparable_units}</TableCell>
                              <TableCell align="right">{formatCurrency(comp.their_avg_rent)}</TableCell>
                              <TableCell align="right">${comp.their_avg_rent_per_sqft?.toFixed(2)}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={`${(comp.avg_similarity_score * 100)?.toFixed(1)}%`}
                                  color={comp.avg_similarity_score > 0.8 ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={comp.their_available_units}
                                  color={comp.their_available_units > 0 ? 'warning' : 'success'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Market Intelligence Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Intelligence Summary
                  </Typography>
                  {trendsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="primary">
                            {propertyTrendsData?.top_competitors?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Active Competitors
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="success.main">
                            {propertyTrendsData?.market_positioning?.reduce((sum: number, item: any) => sum + item.total_competitor_units, 0) || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Competitor Units
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="warning.main">
                            {propertyTrendsData?.top_competitors?.reduce((sum: number, comp: any) => sum + comp.their_available_units, 0) || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Competitor Availability
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        {!isPropertySelected && (
          <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="textSecondary">
              Select a property to view market trends.
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default DashboardPage; 