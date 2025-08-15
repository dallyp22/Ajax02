#!/usr/bin/env python3

"""
ETL Pipeline: Transform uploaded data to match existing analytics table schemas.
This allows the system to seamlessly use uploaded data instead of static tables.
"""

import sys
sys.path.append('.')

from google.cloud import bigquery
from app.config import settings
from datetime import datetime

def create_analytics_tables_from_uploads():
    """Create analytics-compatible tables from uploaded data."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # 1. Create analytics-compatible rent roll table
    rent_roll_query = f"""
    CREATE OR REPLACE TABLE `{settings.gcp_project_id}.uploads.analytics_rent_roll` AS
    SELECT 
        -- Map uploaded columns to analytics schema
        unit AS Unit,
        NULL AS Tags,
        CONCAT(CAST(bedroom AS STRING), 'BR/', CAST(bathrooms AS STRING), 'BA') AS BD_BA,
        bedroom AS Bedroom,
        CAST(bathrooms AS INT64) AS Bathrooms,
        NULL AS Tenant,
        status AS Status,
        CAST(sqft AS INT64) AS Sqft,
        market_rent AS Market_Rent,
        current_rent AS Rent,
        NULL AS Deposit,
        NULL AS Lease_From,
        NULL AS Lease_To,
        NULL AS Move_in,
        NULL AS Move_out,
        NULL AS Past_Due,
        NULL AS NSF_Count,
        NULL AS Late_Count,
        property AS Property,
        NULL AS Unit_Type,
        CASE WHEN sqft > 0 THEN market_rent / sqft ELSE NULL END AS Monthly_Market_Rent_SF,
        CASE WHEN sqft > 0 THEN current_rent / sqft ELSE NULL END AS Monthly_Rent_SF,
        CASE WHEN occupancy_status = 'VACANT' THEN TRUE ELSE FALSE END AS Rent_Ready,
        occupancy_status AS Rent_Status,
        NULL AS Last_Rent_Increase_Date,
        NULL AS Next_Rent_Increase_Date,
        NULL AS Next_Rent_Increase_Amount,
        current_rent AS Advertised_Rent,
        NULL AS Previous_Rent,
        NULL AS Last_Move_Out,
        FALSE AS exclude_flag
    FROM (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY upload_date DESC) as rn
        FROM `{settings.gcp_project_id}.uploads.rent_roll_history_simple`
    )
    WHERE rn = 1  -- Get most recent upload for each unit
    """
    
    # 2. Create analytics-compatible competition table
    competition_query = f"""
    CREATE OR REPLACE TABLE `{settings.gcp_project_id}.uploads.analytics_competition` AS
    SELECT 
        -- Map uploaded columns to analytics schema
        reporting_property_name AS Property,
        unit AS Unit,
        CAST(market_rent AS FLOAT64) AS Base_Price,
        CAST(avg_sq_ft AS INT64) AS Sq_Ft,
        CASE 
            WHEN days_vacant = 0 THEN 'Now'
            WHEN days_vacant > 0 THEN CONCAT(CAST(days_vacant AS STRING), ' days')
            ELSE 'Unknown'
        END AS Availability,
        bedrooms AS Bed,
        '1' AS Bath,  -- Default since we don't have bathroom data
        'Not Specified' AS Deposit
    FROM (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY reporting_property_name, unit ORDER BY upload_date DESC) as rn
        FROM `{settings.gcp_project_id}.uploads.competition_history_simple`
        WHERE reporting_property_name IS NOT NULL 
          AND reporting_property_name != ''
    )
    WHERE rn = 1  -- Get most recent upload for each unit
    """
    
    try:
        print("🔄 Creating analytics-compatible rent roll table...")
        job = client.query(rent_roll_query)
        job.result()  # Wait for completion
        print("✅ Analytics rent roll table created")
        
        print("🔄 Creating analytics-compatible competition table...")
        job = client.query(competition_query)
        job.result()  # Wait for completion
        print("✅ Analytics competition table created")
        
        # Get row counts
        rent_roll_count = client.query(f"SELECT COUNT(*) as count FROM `{settings.gcp_project_id}.uploads.analytics_rent_roll`").to_dataframe().iloc[0]['count']
        competition_count = client.query(f"SELECT COUNT(*) as count FROM `{settings.gcp_project_id}.uploads.analytics_competition`").to_dataframe().iloc[0]['count']
        
        print(f"📊 Analytics tables ready:")
        print(f"   - Rent Roll: {rent_roll_count} units")
        print(f"   - Competition: {competition_count} units")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating analytics tables: {e}")
        return False

def create_month_specific_analytics_tables(data_month: str):
    """Create analytics tables for a specific month of data."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # Parse month (format: 2024-12)
    year, month = data_month.split('-')
    
    # Create tables for specific month
    rent_roll_query = f"""
    CREATE OR REPLACE TABLE `{settings.gcp_project_id}.uploads.analytics_rent_roll_{year}_{month}` AS
    SELECT 
        -- Same mapping as above but filtered by month
        unit AS Unit,
        NULL AS Tags,
        CONCAT(CAST(bedroom AS STRING), 'BR/', CAST(bathrooms AS STRING), 'BA') AS BD_BA,
        bedroom AS Bedroom,
        CAST(bathrooms AS INT64) AS Bathrooms,
        NULL AS Tenant,
        status AS Status,
        CAST(sqft AS INT64) AS Sqft,
        market_rent AS Market_Rent,
        current_rent AS Rent,
        NULL AS Deposit,
        NULL AS Lease_From,
        NULL AS Lease_To,
        NULL AS Move_in,
        NULL AS Move_out,
        NULL AS Past_Due,
        NULL AS NSF_Count,
        NULL AS Late_Count,
        property AS Property,
        NULL AS Unit_Type,
        CASE WHEN sqft > 0 THEN market_rent / sqft ELSE NULL END AS Monthly_Market_Rent_SF,
        CASE WHEN sqft > 0 THEN current_rent / sqft ELSE NULL END AS Monthly_Rent_SF,
        CASE WHEN occupancy_status = 'VACANT' THEN TRUE ELSE FALSE END AS Rent_Ready,
        occupancy_status AS Rent_Status,
        NULL AS Last_Rent_Increase_Date,
        NULL AS Next_Rent_Increase_Date,
        NULL AS Next_Rent_Increase_Amount,
        current_rent AS Advertised_Rent,
        NULL AS Previous_Rent,
        NULL AS Last_Move_Out,
        FALSE AS exclude_flag
    FROM `{settings.gcp_project_id}.uploads.rent_roll_history_simple`
    WHERE EXTRACT(YEAR FROM data_month) = {year}
      AND EXTRACT(MONTH FROM data_month) = {month}
    """
    
    try:
        print(f"🔄 Creating analytics tables for {data_month}...")
        job = client.query(rent_roll_query)
        job.result()
        print(f"✅ Month-specific analytics tables created for {data_month}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating month-specific tables: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Creating analytics tables from uploaded data...")
    
    # Create latest data analytics tables
    success = create_analytics_tables_from_uploads()
    
    if success:
        print("\n✅ Analytics pipeline ready!")
        print("\nNext steps:")
        print("1. Update table configuration to point to: uploads.analytics_rent_roll")
        print("2. Update competition table to: uploads.analytics_competition")
        print("3. All existing analytics will work with uploaded data!")
    else:
        print("\n❌ Pipeline creation failed")
        sys.exit(1)
