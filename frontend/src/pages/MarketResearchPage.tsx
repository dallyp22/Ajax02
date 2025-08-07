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
  ArchiveBenchmarkResponse,
  ArchiveVacancyResponse,
  ArchiveRentSpreadResponse,
  ArchiveClusteringResponse,
  ArchiveRecommendationResponse,
} from '@/types/api';

const COLORS = {
  archive: '#01D1D1',
  competition: '#6B7280',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const AXIS_STYLE = {
  tick: { fill: '#FFFFFF' },
  axisLine: { stroke: 'rgba(255,255,255,0.6)' },
  tickLine: { stroke: 'rgba(255,255,255,0.6)' },
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

const MarketResearchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [bedroomFilter, setBedroomFilter] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('Both');
  const [vacancyRange, setVacancyRange] = useState<number[]>([0, 90]);
  const [showOnlyOpportunities, setShowOnlyOpportunities] = useState(false);

  // Data fetching with React Query
  const { data: benchmarkData, isLoading: benchmarkLoading, error: benchmarkError } = useQuery({
    queryKey: ['archive-benchmark', bedroomFilter],
    queryFn: () => apiService.getArchiveBenchmarkAnalysis(bedroomFilter || undefined),
  });

  const { data: vacancyData, isLoading: vacancyLoading, error: vacancyError } = useQuery({
    queryKey: ['archive-vacancy', bedroomFilter],
    queryFn: () => apiService.getArchiveVacancyAnalysis(bedroomFilter || undefined),
  });

  const { data: rentSpreadData, isLoading: rentSpreadLoading, error: rentSpreadError } = useQuery({
    queryKey: ['archive-rent-spread'],
    queryFn: () => apiService.getArchiveRentSpreadAnalysis(),
  });

  const { data: clusteringData, isLoading: clusteringLoading, error: clusteringError } = useQuery({
    queryKey: ['archive-clustering', bedroomFilter],
    queryFn: () => apiService.getArchiveMarketRentClustering(bedroomFilter || undefined),
  });

  const { data: recommendationsData, isLoading: recommendationsLoading, error: recommendationsError } = useQuery({
    queryKey: ['archive-recommendations'],
    queryFn: () => apiService.getArchiveOptimizationRecommendations(),
  });

  // Data preparation functions
  const prepareBenchmarkData = () => {
    if (!benchmarkData?.benchmark_data) return [];
    
    return benchmarkData.benchmark_data
      .filter((item: any) => {
        if (propertyTypeFilter !== 'Both' && item.Property_Type !== propertyTypeFilter) return false;
        return true;
      })
      .map((item: any) => ({
        property: item.Reporting_Property_Name,
        propertyType: item.Property_Type,
        bedrooms: item.Bedrooms,
        rent: item.avg_market_rent,
        psf: item.avg_market_rent_psf,
        sqft: item.avg_sq_ft,
        units: item.unit_count,
        fill: item.Property_Type === 'Archive' ? COLORS.archive : COLORS.competition,
      }))
      .sort((a: any, b: any) => b.rent - a.rent);
  };

  const prepareVacancyData = () => {
    if (!vacancyData?.vacancy_data) return [];
    
    return vacancyData.vacancy_data
      .filter((item: any) => {
        if (propertyTypeFilter !== 'Both' && item.Property_Type !== propertyTypeFilter) return false;
        return true;
      })
      .map((item: any) => ({
        property: item.Reporting_Property_Name,
        propertyType: item.Property_Type,
        bedrooms: item.Bedrooms,
        avgDaysVacant: item.avg_days_vacant,
        totalUnits: item.total_units,
        unitsVacant30Plus: item.units_vacant_30plus,
        fill: item.Property_Type === 'Archive' ? COLORS.archive : COLORS.competition,
      }));
  };

  const prepareRentSpreadData = () => {
    if (!rentSpreadData?.rent_spread_data) return [];
    
    return rentSpreadData.rent_spread_data
      .filter((item: any) => {
        if (showOnlyOpportunities && Math.abs(item.pct_below_market) < 10) return false;
        return true;
      })
      .map((item: any) => ({
        ...item,
        propertyType: 'Archive',
      }));
  };

  const prepareClusteringData = () => {
    if (!clusteringData?.clustering_data) return [];
    
    return clusteringData.clustering_data;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (benchmarkError || vacancyError || rentSpreadError || clusteringError || recommendationsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading market research data. Please check your archive table configuration in Settings.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ color: '#01D1D1', fontWeight: 600 }}>
        Market Research Analytics
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#FFFFFF' }} gutterBottom>
        Archive Apartments vs Competition Analysis
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Bedroom Type</InputLabel>
                <Select
                  value={bedroomFilter}
                  label="Bedroom Type"
                  onChange={(e) => setBedroomFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="1">1 Bedroom</MenuItem>
                  <MenuItem value="2">2 Bedrooms</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={propertyTypeFilter}
                  label="Property Type"
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                >
                  <MenuItem value="Both">Both</MenuItem>
                  <MenuItem value="Archive">Archive Only</MenuItem>
                  <MenuItem value="Competition">Competition Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Vacancy Range (Days)</Typography>
              <Slider
                value={vacancyRange}
                onChange={(_, value) => setVacancyRange(value as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={365}
                marks={[
                  { value: 0, label: '0' },
                  { value: 30, label: '30' },
                  { value: 60, label: '60' },
                  { value: 90, label: '90' },
                  { value: 365, label: '365' },
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyOpportunities}
                    onChange={(e) => setShowOnlyOpportunities(e.target.checked)}
                  />
                }
                label="Opportunities Only"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<CompareIcon />} label="Benchmark Analysis" />
          <Tab icon={<TrendingUpIcon />} label="Vacancy Performance" />
          <Tab icon={<MoneyIcon />} label="Rent Spread Tracker" />
          <Tab icon={<AssessmentIcon />} label="Market Clustering" />
          <Tab icon={<CheckCircleIcon />} label="Recommendations" />
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
                <Typography variant="body2" sx={{ color: '#FFFFFF' }} gutterBottom>
                  {bedroomFilter !== 'All' ? `${bedroomFilter} bedroom units` : 'All bedroom types'} - 
                  <span style={{ color: COLORS.archive, fontWeight: 'bold' }}> ● Archive</span> vs 
                  <span style={{ color: COLORS.competition, fontWeight: 'bold' }}> ● Competition</span>
                </Typography>
                {benchmarkLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
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
                        tick={AXIS_STYLE.tick}
                        axisLine={AXIS_STYLE.axisLine}
                        tickLine={AXIS_STYLE.tickLine}
                      />
                      <YAxis tick={AXIS_STYLE.tick} axisLine={AXIS_STYLE.axisLine} tickLine={AXIS_STYLE.tickLine} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'rent' ? formatCurrency(value) : value,
                          name === 'rent' ? 'Market Rent' : name
                        ]}
                        labelFormatter={(label) => `Property: ${label}`}
                      />
                      <Bar 
                        dataKey="rent" 
                        name="Market Rent"
                        fill="#8884d8"
                      >
                        {prepareBenchmarkData().map((entry: any, index: any) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="units" position="insideTop" fill="#FFFFFF" fontSize={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Rent Per Square Foot Chart - Full Width, Second */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rent Per Square Foot Comparison
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFFFFF' }} gutterBottom>
                  {bedroomFilter !== 'All' ? `${bedroomFilter} bedroom units` : 'All bedroom types'} - 
                  <span style={{ color: COLORS.archive, fontWeight: 'bold' }}> ● Archive</span> vs 
                  <span style={{ color: COLORS.competition, fontWeight: 'bold' }}> ● Competition</span>
                </Typography>
                {benchmarkLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
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
                        tick={AXIS_STYLE.tick}
                        axisLine={AXIS_STYLE.axisLine}
                        tickLine={AXIS_STYLE.tickLine}
                      />
                      <YAxis tick={AXIS_STYLE.tick} axisLine={AXIS_STYLE.axisLine} tickLine={AXIS_STYLE.tickLine} />
                      <Tooltip 
                        formatter={(value: any) => [`$${value?.toFixed(2)}`, 'PSF']}
                        labelFormatter={(label) => `Property: ${label}`}
                      />
                      <Bar dataKey="psf" name="Rent PSF">
                        {prepareBenchmarkData().sort((a: any, b: any) => b.psf - a.psf).map((entry: any, index: any) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="units" position="insideTop" fill="#FFFFFF" fontSize={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Property Summary
                </Typography>
                <TableContainer>
                  <Table>
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
                      {prepareBenchmarkData().map((row: any, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.property}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.propertyType}
                              size="small"
                              sx={{ 
                                backgroundColor: row.propertyType === 'Archive' ? COLORS.archive : COLORS.competition,
                                color: '#000',
                              }}
                            />
                          </TableCell>
                          <TableCell>{row.bedrooms}</TableCell>
                          <TableCell align="right">{row.units}</TableCell>
                          <TableCell align="right">{formatCurrency(row.rent)}</TableCell>
                          <TableCell align="right">${row.psf?.toFixed(2)}</TableCell>
                          <TableCell align="right">{row.sqft?.toLocaleString()} sq ft</TableCell>
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
          {/* Vacancy Charts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Days Vacant
                </Typography>
                {vacancyLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareVacancyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="property" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                        tick={AXIS_STYLE.tick}
                        axisLine={AXIS_STYLE.axisLine}
                        tickLine={AXIS_STYLE.tickLine}
                      />
                      <YAxis tick={AXIS_STYLE.tick} axisLine={AXIS_STYLE.axisLine} tickLine={AXIS_STYLE.tickLine} />
                      <Tooltip />
                      <Bar dataKey="avgDaysVacant" name="Avg Days Vacant">
                        {prepareVacancyData().map((entry: any, index: any) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="totalUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  % Units Vacant 30+ Days
                </Typography>
                {vacancyLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareVacancyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="property" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                        tick={AXIS_STYLE.tick}
                        axisLine={AXIS_STYLE.axisLine}
                        tickLine={AXIS_STYLE.tickLine}
                      />
                      <YAxis tick={AXIS_STYLE.tick} axisLine={AXIS_STYLE.axisLine} tickLine={AXIS_STYLE.tickLine} />
                      <Tooltip formatter={(value: any) => [`${value?.toFixed(1)}%`, '% Vacant 30+ Days']} />
                      <Bar dataKey="pct_vacant_30plus" name="% Vacant 30+ Days" fill="#f59e0b" >
                        <LabelList dataKey="totalUnits" position="insideTop" fill="#FFFFFF" fontSize={10} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Archive Rent Spread Analysis (Internal Tracker)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Advertised vs Market Rent for Archive properties only
                </Typography>
                {rentSpreadLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Unit</TableCell>
                          <TableCell>Bedrooms</TableCell>
                          <TableCell align="right">Market Rent</TableCell>
                          <TableCell align="right">Advertised Rent</TableCell>
                          <TableCell align="right">Gap %</TableCell>
                          <TableCell align="right">Days Vacant</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prepareRentSpreadData().map((row: any, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.Unit}</TableCell>
                            <TableCell>{row.Bedrooms}</TableCell>
                            <TableCell align="right">{formatCurrency(row.Market_Rent)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.Advertised_Rent)}</TableCell>
                            <TableCell align="right">
                              <Typography 
                                color={row.pct_below_market < -10 ? 'error' : row.pct_below_market > 5 ? 'warning' : 'text.primary'}
                              >
                                {row.pct_below_market > 0 ? '+' : ''}{row.pct_below_market?.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{row.Days_Vacant}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.suggested_action}
                                size="small"
                                color={
                                  row.suggested_action === 'Raise rent' ? 'success' : 
                                  row.suggested_action === 'Lower rent' ? 'warning' : 'default'
                                }
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
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Rent Clustering
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFFFFF' }} gutterBottom>
                  Rent bucket distribution across Archive and Competition
                </Typography>
                {clusteringLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rent Bucket</TableCell>
                          <TableCell>Bedrooms</TableCell>
                          <TableCell>Property Type</TableCell>
                          <TableCell align="right">Unit Count</TableCell>
                          <TableCell align="right">Avg Days Vacant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prepareClusteringData().map((row: any, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.rent_bucket}</TableCell>
                            <TableCell>{row.Bedrooms}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.Property_Type}
                                size="small"
                                sx={{ 
                                  backgroundColor: row.Property_Type === 'Archive' ? COLORS.archive : COLORS.competition,
                                  color: '#000',
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">{row.unit_count}</TableCell>
                            <TableCell align="right">{row.avg_days_vacant?.toFixed(1)}</TableCell>
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
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Recommendations (Archive Properties Only)
                </Typography>
                {recommendationsLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Unit</TableCell>
                          <TableCell>Bedrooms</TableCell>
                          <TableCell align="right">Market Rent</TableCell>
                          <TableCell align="right">Advertised Rent</TableCell>
                          <TableCell align="right">Days Vacant</TableCell>
                          <TableCell>Suggested Action</TableCell>
                          <TableCell>Priority</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recommendationsData?.recommendations?.map((row: any, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.Unit}</TableCell>
                            <TableCell>{row.Bedrooms}</TableCell>
                            <TableCell align="right">{formatCurrency(row.Market_Rent)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.Advertised_Rent)}</TableCell>
                            <TableCell align="right">{row.Days_Vacant}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.suggested_action}
                                size="small"
                                color={
                                  row.suggested_action === 'Raise rent' ? 'success' : 
                                  row.suggested_action === 'Lower rent' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={row.priority}
                                size="small"
                                color={
                                  row.priority === 'High' ? 'error' : 
                                  row.priority === 'Medium' ? 'warning' : 'default'
                                }
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
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default MarketResearchPage; 