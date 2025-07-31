import React from 'react';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CompareArrows as CompareIcon,
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
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardPage: React.FC = () => {
  // Fetch all analytics data
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio-analytics'],
    queryFn: () => apiService.getPortfolioAnalytics(),
  });

  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-position'],
    queryFn: () => apiService.getMarketPosition(),
  });

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['pricing-opportunities'],
    queryFn: () => apiService.getPricingOpportunities(),
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

  const portfolio = portfolioData?.portfolio || {};
  const marketSummary = marketData?.market_summary || [];
  const opportunities = opportunitiesData?.summary || {};

  // Prepare chart data
  const occupancyData = [
    { name: 'Occupied', value: portfolio.occupied_units || 0, color: '#00C49F' },
    { name: 'Vacant', value: portfolio.vacant_units || 0, color: '#FF8042' },
    { name: 'Notice', value: portfolio.notice_units || 0, color: '#FFBB28' },
  ];

  const urgencyData = portfolioData?.urgency_breakdown?.map((item: any, index: number) => ({
    name: item.pricing_urgency,
    value: item.unit_count,
    color: COLORS[index % COLORS.length],
  })) || [];

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

  return (
    <Box>
      {/* Header Section with Command Center Styling */}
      <Box 
        sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.05) 0%, rgba(42, 157, 143, 0.05) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #01D1D1, transparent)',
            opacity: 0.8,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(1, 209, 209, 0.3)',
            }}
          >
            <TrendingUpIcon sx={{ color: '#000', fontSize: 20 }} />
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
              Command Center Analytics
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                letterSpacing: '0.5px'
              }}
            >
              Real-time optimization intelligence for your rental portfolio
            </Typography>
          </Box>
        </Box>
        
        {/* Live Status Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#2A9D8F',
              boxShadow: '0 0 8px #2A9D8F',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 8px #2A9D8F' },
                '50%': { boxShadow: '0 0 16px #2A9D8F, 0 0 24px #2A9D8F' },
                '100%': { boxShadow: '0 0 8px #2A9D8F' },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: '#2A9D8F', fontWeight: 600, fontSize: '0.75rem' }}>
            LIVE DATA STREAM ACTIVE
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Key Performance Indicators */}
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.1) 0%, rgba(42, 157, 143, 0.05) 100%)',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(1, 209, 209, 0.2)',
              '& .metric-icon': {
                transform: 'scale(1.1)',
                filter: 'drop-shadow(0 0 12px rgba(1, 209, 209, 0.8))',
              }
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '1px'
                    }}
                  >
                    TOTAL UNITS
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#01D1D1',
                      textShadow: '0 0 20px rgba(1, 209, 209, 0.3)',
                      mt: 1
                    }}
                  >
                    {formatNumber(portfolio.total_units || 0)}
                  </Typography>
                </Box>
                <HomeIcon 
                  className="metric-icon"
                  sx={{ 
                    fontSize: 48,
                    color: '#01D1D1',
                    opacity: 0.8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(42, 157, 143, 0.1) 0%, rgba(42, 157, 143, 0.05) 100%)',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(42, 157, 143, 0.2)',
              '& .metric-icon': {
                transform: 'scale(1.1)',
                filter: 'drop-shadow(0 0 12px rgba(42, 157, 143, 0.8))',
              }
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '1px'
                    }}
                  >
                    OCCUPANCY RATE
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2A9D8F',
                      textShadow: '0 0 20px rgba(42, 157, 143, 0.3)',
                      mt: 1
                    }}
                  >
                    {(portfolio.occupancy_rate || 0).toFixed(1)}%
                  </Typography>
                </Box>
                <CheckCircleIcon 
                  className="metric-icon"
                  sx={{ 
                    fontSize: 48,
                    color: '#2A9D8F',
                    opacity: 0.8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(42, 157, 143, 0.1) 0%, rgba(1, 209, 209, 0.05) 100%)',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(42, 157, 143, 0.2)',
              '& .metric-icon': {
                transform: 'scale(1.1)',
                filter: 'drop-shadow(0 0 12px rgba(42, 157, 143, 0.8))',
              }
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '1px'
                    }}
                  >
                    ANNUAL REVENUE
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2A9D8F',
                      textShadow: '0 0 20px rgba(42, 157, 143, 0.3)',
                      mt: 1,
                      fontSize: '1.75rem'
                    }}
                  >
                    {formatCurrency(portfolio.current_annual_revenue || 0)}
                  </Typography>
                </Box>
                <MoneyIcon 
                  className="metric-icon"
                  sx={{ 
                    fontSize: 48,
                    color: '#2A9D8F',
                    opacity: 0.8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.1) 0%, rgba(244, 162, 97, 0.05) 100%)',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(244, 162, 97, 0.2)',
              '& .metric-icon': {
                transform: 'scale(1.1)',
                filter: 'drop-shadow(0 0 12px rgba(244, 162, 97, 0.8))',
              }
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '1px'
                    }}
                  >
                    REVENUE OPPORTUNITY
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#F4A261',
                      textShadow: '0 0 20px rgba(244, 162, 97, 0.3)',
                      mt: 1,
                      fontSize: '1.5rem'
                    }}
                  >
                    {formatCurrency(opportunities.total_annual_opportunity || 0)}
                  </Typography>
                </Box>
                <TrendingUpIcon 
                  className="metric-icon"
                  sx={{ 
                    fontSize: 48,
                    color: '#F4A261',
                    opacity: 0.8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
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
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {occupancyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                <BarChart data={urgencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {urgencyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                  {marketSummary.map((item: any, index: number) => (
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
        {portfolioData?.property_performance && (
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
                        <TableCell align="right">Vacant Units</TableCell>
                        <TableCell align="right">Avg Rent</TableCell>
                        <TableCell align="right">Avg $/SqFt</TableCell>
                        <TableCell align="right">Revenue Potential</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {portfolioData.property_performance.slice(0, 8).map((property: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {property.property}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{property.total_units}</TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={property.vacant_units}
                              color={property.vacant_units > 0 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(property.avg_rent)}
                          </TableCell>
                          <TableCell align="right">
                            ${property.avg_rent_per_sqft?.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(property.revenue_potential)}
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
    </Box>
  );
};

export default DashboardPage; 