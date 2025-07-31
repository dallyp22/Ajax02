"""
BigQuery database service layer.
"""
import logging
from typing import Dict, List, Optional

import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

from app.config import settings

logger = logging.getLogger(__name__)


class BigQueryService:
    """Service for interacting with BigQuery."""
    
    def __init__(self):
        """Initialize BigQuery client."""
        self.client = bigquery.Client(project=settings.gcp_project_id)
        self.staging_dataset = settings.bigquery_dataset_staging
        self.mart_dataset = settings.bigquery_dataset_mart
    
    async def test_connection(self) -> bool:
        """Test BigQuery connection."""
        try:
            # Simple query to test connection
            query = "SELECT 1 as test"
            self.client.query(query).result()
            return True
        except Exception as e:
            logger.error(f"BigQuery connection test failed: {e}")
            return False
    
    def _get_table_name(self, dataset: str, table: str) -> str:
        """Get fully qualified table name."""
        return f"`{settings.gcp_project_id}.{dataset}.{table}`"
    
    async def get_units(
        self, 
        page: int = 1, 
        page_size: int = 50,
        status_filter: Optional[str] = None,
        property_filter: Optional[str] = None,
        needs_pricing_only: bool = False
    ) -> tuple[List[Dict], int]:
        """
        Get paginated list of units.
        
        Args:
            page: Page number (1-based)
            page_size: Number of units per page
            status_filter: Filter by unit status
            property_filter: Filter by property name
            needs_pricing_only: Only return units that need pricing
            
        Returns:
            Tuple of (units_list, total_count)
        """
        # Build WHERE clause
        where_conditions = ["has_complete_data = TRUE"]
        
        if status_filter:
            where_conditions.append(f"status = '{status_filter}'")
        
        if property_filter:
            where_conditions.append(f"property = '{property_filter}'")
            
        if needs_pricing_only:
            where_conditions.append("needs_pricing = TRUE")
        
        where_clause = " AND ".join(where_conditions)
        
        # Count query
        count_query = f"""
        SELECT COUNT(*) as total_count
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE {where_clause}
        """
        
        # Data query with pagination
        offset = (page - 1) * page_size
        data_query = f"""
        SELECT
            unit_id,
            property,
            bed,
            bath,
            sqft,
            status,
            advertised_rent,
            market_rent,
            rent_per_sqft,
            move_out_date,
            lease_end_date,
            days_to_lease_end,
            needs_pricing,
            rent_premium_pct,
            pricing_urgency,
            unit_type,
            size_category,
            annual_revenue_potential,
            has_complete_data
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE {where_clause}
        ORDER BY 
            CASE WHEN needs_pricing THEN 0 ELSE 1 END,
            pricing_urgency DESC,
            property,
            unit_id
        LIMIT {page_size}
        OFFSET {offset}
        """
        
        try:
            # Execute count query
            count_result = self.client.query(count_query).result()
            total_count = next(iter(count_result)).total_count
            
            # Execute data query
            data_result = self.client.query(data_query).result()
            units = [dict(row) for row in data_result]
            
            logger.info(f"Retrieved {len(units)} units (page {page}, total: {total_count})")
            return units, total_count
            
        except Exception as e:
            logger.error(f"Error fetching units: {e}")
            raise
    
    async def get_unit_by_id(self, unit_id: str) -> Optional[Dict]:
        """Get a single unit by ID."""
        query = f"""
        SELECT
            unit_id,
            property,
            bed,
            bath,
            sqft,
            status,
            advertised_rent,
            market_rent,
            rent_per_sqft,
            move_out_date,
            lease_end_date,
            days_to_lease_end,
            needs_pricing,
            rent_premium_pct,
            pricing_urgency,
            unit_type,
            size_category,
            annual_revenue_potential,
            has_complete_data
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE unit_id = '{unit_id}'
        """
        
        try:
            result = self.client.query(query).result()
            rows = list(result)
            return dict(rows[0]) if rows else None
        except Exception as e:
            logger.error(f"Error fetching unit {unit_id}: {e}")
            raise
    
    async def get_unit_comparables(self, unit_id: str) -> pd.DataFrame:
        """Get comparable units for a specific unit."""
        query = f"""
        SELECT
            unit_id,
            our_property,
            bed,
            bath,
            our_sqft,
            advertised_rent,
            comp_id,
            comp_property,
            comp_sqft,
            comp_price,
            is_available,
            sqft_delta_pct,
            price_gap_pct,
            similarity_score,
            comp_rank,
            total_comps,
            avg_comp_price,
            median_comp_price,
            min_comp_price,
            max_comp_price,
            comp_price_stddev
        FROM {self._get_table_name(self.mart_dataset, 'unit_competitor_pairs')}
        WHERE unit_id = '{unit_id}'
        ORDER BY comp_rank
        """
        
        try:
            df = self.client.query(query).to_dataframe()
            logger.info(f"Retrieved {len(df)} comparables for unit {unit_id}")
            return df
        except Exception as e:
            logger.error(f"Error fetching comparables for unit {unit_id}: {e}")
            return pd.DataFrame()
    
    async def get_vacant_units(self, limit: Optional[int] = None) -> List[Dict]:
        """Get all vacant units that need pricing."""
        limit_clause = f"LIMIT {limit}" if limit else ""
        
        query = f"""
        SELECT
            unit_id,
            property,
            bed,
            bath,
            sqft,
            status,
            advertised_rent,
            market_rent,
            rent_per_sqft,
            pricing_urgency,
            unit_type,
            size_category
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE needs_pricing = TRUE
          AND has_complete_data = TRUE
        ORDER BY 
            CASE 
                WHEN pricing_urgency = 'IMMEDIATE' THEN 0
                WHEN pricing_urgency = 'HIGH' THEN 1
                WHEN pricing_urgency = 'MEDIUM' THEN 2
                ELSE 3
            END,
            property,
            unit_id
        {limit_clause}
        """
        
        try:
            result = self.client.query(query).result()
            units = [dict(row) for row in result]
            logger.info(f"Retrieved {len(units)} vacant units")
            return units
        except Exception as e:
            logger.error(f"Error fetching vacant units: {e}")
            raise
    
    async def get_properties(self) -> List[str]:
        """Get list of all properties."""
        query = f"""
        SELECT DISTINCT property
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE property IS NOT NULL
        ORDER BY property
        """
        
        try:
            result = self.client.query(query).result()
            properties = [row.property for row in result]
            return properties
        except Exception as e:
            logger.error(f"Error fetching properties: {e}")
            return []
    
    async def get_unit_types_summary(self) -> Dict:
        """Get summary statistics by unit type."""
        query = f"""
        SELECT
            unit_type,
            COUNT(*) as total_units,
            SUM(CASE WHEN needs_pricing THEN 1 ELSE 0 END) as units_needing_pricing,
            AVG(advertised_rent) as avg_rent,
            AVG(rent_per_sqft) as avg_rent_per_sqft
        FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        WHERE has_complete_data = TRUE
        GROUP BY unit_type
        ORDER BY unit_type
        """
        
        try:
            result = self.client.query(query).result()
            summary = {}
            for row in result:
                summary[row.unit_type] = {
                    'total_units': row.total_units,
                    'units_needing_pricing': row.units_needing_pricing,
                    'avg_rent': float(row.avg_rent) if row.avg_rent else 0,
                    'avg_rent_per_sqft': float(row.avg_rent_per_sqft) if row.avg_rent_per_sqft else 0
                }
            return summary
        except Exception as e:
            logger.error(f"Error fetching unit types summary: {e}")
            return {}
    
    async def get_portfolio_analytics(self) -> Dict:
        """Get comprehensive portfolio analytics."""
        query = f"""
        WITH portfolio_metrics AS (
          SELECT
            COUNT(*) as total_units,
            SUM(CASE WHEN status = 'VACANT' THEN 1 ELSE 0 END) as vacant_units,
            SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_units,
            SUM(CASE WHEN status = 'NOTICE' THEN 1 ELSE 0 END) as notice_units,
            SUM(CASE WHEN needs_pricing = TRUE THEN 1 ELSE 0 END) as units_needing_pricing,
            SUM(annual_revenue_potential) as total_revenue_potential,
            SUM(CASE WHEN status = 'OCCUPIED' THEN advertised_rent * 12 ELSE 0 END) as current_annual_revenue,
            AVG(rent_per_sqft) as avg_rent_per_sqft,
            AVG(CASE WHEN status = 'OCCUPIED' THEN advertised_rent ELSE NULL END) as avg_occupied_rent,
            AVG(CASE WHEN status = 'VACANT' THEN advertised_rent ELSE NULL END) as avg_vacant_rent
          FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
        ),
        urgency_breakdown AS (
          SELECT
            pricing_urgency,
            COUNT(*) as unit_count
          FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
          WHERE needs_pricing = TRUE
          GROUP BY pricing_urgency
        ),
        property_performance AS (
          SELECT
            property,
            COUNT(*) as total_units,
            SUM(CASE WHEN status = 'VACANT' THEN 1 ELSE 0 END) as vacant_units,
            ROUND(AVG(advertised_rent), 2) as avg_rent,
            ROUND(AVG(rent_per_sqft), 2) as avg_rent_per_sqft,
            SUM(annual_revenue_potential) as revenue_potential
          FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
          GROUP BY property
          ORDER BY revenue_potential DESC
          LIMIT 10
        )
        SELECT 
          JSON_OBJECT(
            'total_units', (SELECT total_units FROM portfolio_metrics),
            'vacant_units', (SELECT vacant_units FROM portfolio_metrics),
            'occupied_units', (SELECT occupied_units FROM portfolio_metrics),
            'notice_units', (SELECT notice_units FROM portfolio_metrics),
            'units_needing_pricing', (SELECT units_needing_pricing FROM portfolio_metrics),
            'total_revenue_potential', (SELECT total_revenue_potential FROM portfolio_metrics),
            'current_annual_revenue', (SELECT current_annual_revenue FROM portfolio_metrics),
            'avg_rent_per_sqft', (SELECT avg_rent_per_sqft FROM portfolio_metrics),
            'avg_occupied_rent', (SELECT avg_occupied_rent FROM portfolio_metrics),
            'avg_vacant_rent', (SELECT avg_vacant_rent FROM portfolio_metrics)
          ) as portfolio_json
        """
        
        try:
            result = self.client.query(query).result()
            portfolio_data = list(result)[0]['portfolio_json']
            
            # Get urgency breakdown
            urgency_query = f"""
            SELECT
              pricing_urgency,
              COUNT(*) as unit_count
            FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
            WHERE needs_pricing = TRUE
            GROUP BY pricing_urgency
            """
            urgency_result = self.client.query(urgency_query).to_dataframe()
            urgency_breakdown = urgency_result.to_dict(orient='records')
            
            # Get property performance
            property_query = f"""
            SELECT
              property,
              COUNT(*) as total_units,
              SUM(CASE WHEN status = 'VACANT' THEN 1 ELSE 0 END) as vacant_units,
              ROUND(AVG(advertised_rent), 2) as avg_rent,
              ROUND(AVG(rent_per_sqft), 2) as avg_rent_per_sqft,
              SUM(annual_revenue_potential) as revenue_potential
            FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')}
            GROUP BY property
            ORDER BY revenue_potential DESC
            LIMIT 10
            """
            property_result = self.client.query(property_query).to_dataframe()
            property_performance = property_result.to_dict(orient='records')
            
            # Calculate additional metrics
            portfolio_data['occupancy_rate'] = (portfolio_data['occupied_units'] / portfolio_data['total_units'] * 100) if portfolio_data['total_units'] > 0 else 0
            portfolio_data['revenue_optimization_potential'] = portfolio_data['total_revenue_potential'] - portfolio_data['current_annual_revenue']
            
            return {
                'portfolio': portfolio_data,
                'urgency_breakdown': urgency_breakdown,
                'property_performance': property_performance
            }
        except Exception as e:
            logger.error(f"Error fetching portfolio analytics: {e}")
            raise
    
    async def get_market_position_analytics(self) -> Dict:
        """Get market positioning analytics against competition."""
        query = f"""
        WITH unit_comp_analysis AS (
          SELECT
            u.unit_id,
            u.property,
            u.unit_type,
            u.advertised_rent,
            u.rent_per_sqft as our_rent_per_sqft,
            c.avg_comp_price,
            CASE 
              WHEN c.avg_comp_price IS NOT NULL AND u.advertised_rent > c.avg_comp_price THEN 'ABOVE_MARKET'
              WHEN c.avg_comp_price IS NOT NULL AND u.advertised_rent < c.avg_comp_price * 0.95 THEN 'BELOW_MARKET'
              ELSE 'AT_MARKET'
            END as market_position,
            CASE 
              WHEN c.avg_comp_price IS NOT NULL THEN 
                ROUND((u.advertised_rent - c.avg_comp_price) / c.avg_comp_price * 100, 1)
              ELSE NULL
            END as premium_discount_pct
          FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')} u
          LEFT JOIN (
            SELECT 
              unit_id,
              AVG(comp_price) as avg_comp_price
            FROM {self._get_table_name(self.mart_dataset, 'unit_competitor_pairs')}
            GROUP BY unit_id
          ) c ON u.unit_id = c.unit_id
        )
        SELECT
          market_position,
          COUNT(*) as unit_count,
          AVG(premium_discount_pct) as avg_premium_discount,
          AVG(advertised_rent) as avg_rent
        FROM unit_comp_analysis
        WHERE premium_discount_pct IS NOT NULL
        GROUP BY market_position
        """
        
        try:
            result = self.client.query(query).to_dataframe()
            market_summary = result.to_dict(orient='records')
            
            # Get unit type comparison
            unit_type_query = f"""
            SELECT
              u.unit_type,
              COUNT(*) as total_units,
              AVG(u.rent_per_sqft) as our_avg_rent_per_sqft,
              AVG(c.avg_comp_price_per_sqft) as market_avg_rent_per_sqft
            FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')} u
            LEFT JOIN (
              SELECT 
                unit_id,
                AVG(comp_price / comp_sqft) as avg_comp_price_per_sqft
              FROM {self._get_table_name(self.mart_dataset, 'unit_competitor_pairs')}
              GROUP BY unit_id
            ) c ON u.unit_id = c.unit_id
            WHERE c.avg_comp_price_per_sqft IS NOT NULL
            GROUP BY u.unit_type
            """
            unit_type_result = self.client.query(unit_type_query).to_dataframe()
            unit_type_comparison = unit_type_result.to_dict(orient='records')
            
            return {
                'market_summary': market_summary,
                'unit_type_comparison': unit_type_comparison
            }
        except Exception as e:
            logger.error(f"Error fetching market position analytics: {e}")
            raise
    
    async def get_pricing_opportunities(self) -> Dict:
        """Get pricing optimization opportunities."""
        query = f"""
        WITH pricing_analysis AS (
          SELECT
            u.unit_id,
            u.property,
            u.unit_type,
            u.status,
            u.advertised_rent,
            u.pricing_urgency,
            u.days_to_lease_end,
            c.avg_comp_price,
            CASE 
              WHEN c.avg_comp_price IS NOT NULL THEN 
                ROUND(c.avg_comp_price - u.advertised_rent, 0)
              ELSE NULL
            END as potential_rent_increase,
            CASE 
              WHEN c.avg_comp_price IS NOT NULL THEN 
                ROUND((c.avg_comp_price - u.advertised_rent) * 12, 0)
              ELSE NULL
            END as annual_revenue_opportunity
          FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')} u
          LEFT JOIN (
            SELECT 
              unit_id,
              AVG(comp_price) as avg_comp_price
            FROM {self._get_table_name(self.mart_dataset, 'unit_competitor_pairs')}
            GROUP BY unit_id
          ) c ON u.unit_id = c.unit_id
        )
        SELECT
          SUM(CASE WHEN potential_rent_increase > 50 THEN 1 ELSE 0 END) as units_with_50plus_opportunity,
          SUM(CASE WHEN potential_rent_increase > 100 THEN 1 ELSE 0 END) as units_with_100plus_opportunity,
          SUM(CASE WHEN potential_rent_increase > 0 THEN potential_rent_increase ELSE 0 END) as total_monthly_opportunity,
          SUM(CASE WHEN annual_revenue_opportunity > 0 THEN annual_revenue_opportunity ELSE 0 END) as total_annual_opportunity,
          AVG(CASE WHEN potential_rent_increase > 0 THEN potential_rent_increase ELSE NULL END) as avg_opportunity_per_unit
        FROM pricing_analysis
        """
        
        try:
            result = self.client.query(query).result()
            summary = dict(list(result)[0])
            
            # Get top opportunities
            top_query = f"""
            WITH pricing_analysis AS (
              SELECT
                u.unit_id,
                u.property,
                u.unit_type,
                u.status,
                u.advertised_rent,
                u.pricing_urgency,
                u.days_to_lease_end,
                c.avg_comp_price,
                ROUND(c.avg_comp_price - u.advertised_rent, 0) as potential_rent_increase,
                ROUND((c.avg_comp_price - u.advertised_rent) * 12, 0) as annual_revenue_opportunity
              FROM {self._get_table_name(self.mart_dataset, 'unit_snapshot')} u
              LEFT JOIN (
                SELECT 
                  unit_id,
                  AVG(comp_price) as avg_comp_price
                FROM {self._get_table_name(self.mart_dataset, 'unit_competitor_pairs')}
                GROUP BY unit_id
              ) c ON u.unit_id = c.unit_id
            )
            SELECT *
            FROM pricing_analysis
            WHERE potential_rent_increase > 0
            ORDER BY annual_revenue_opportunity DESC
            LIMIT 20
            """
            top_result = self.client.query(top_query).to_dataframe()
            top_opportunities = top_result.to_dict(orient='records')
            
            return {
                'summary': summary,
                'top_opportunities': top_opportunities
            }
        except Exception as e:
            logger.error(f"Error fetching pricing opportunities: {e}")
            raise


# Global database service instance
db_service = BigQueryService() 