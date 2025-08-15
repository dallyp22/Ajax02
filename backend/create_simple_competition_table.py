#!/usr/bin/env python3

"""
Create a simplified competition table that matches the actual competition data structure.
"""

import sys
sys.path.append('.')

from google.cloud import bigquery
from app.config import settings

def create_simple_competition_table():
    """Create a simplified competition table with essential columns only."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # Define the simplified table schema based on your competition data
    schema = [
        bigquery.SchemaField("upload_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("property_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("upload_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("data_month", "DATE", mode="REQUIRED"),
        
        # Core competition fields based on your schema
        bigquery.SchemaField("property_type", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("reporting_property_name", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("unit_vacate_date", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("bedrooms", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("unit", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("advertised_market_diff", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("market_rent", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("market_rent_psf", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("advertised_rent", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("avg_sq_ft", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("days_vacant", "INTEGER", mode="NULLABLE"),
        
        # Metadata
        bigquery.SchemaField("data_quality_score", "FLOAT", mode="NULLABLE"),
    ]
    
    # Table ID
    table_id = f"{settings.gcp_project_id}.uploads.competition_history_simple"
    
    # Create table
    table = bigquery.Table(table_id, schema=schema)
    table.description = "Simplified competition history with essential columns only"
    
    try:
        # Drop the existing table if it exists
        try:
            client.delete_table(table_id)
            print(f"Deleted existing table {table_id}")
        except Exception:
            print(f"Table {table_id} doesn't exist, creating new one")
        
        # Create the new table
        table = client.create_table(table)
        print(f"✅ Created table {table_id}")
        print(f"Table has {len(table.schema)} columns")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        return False

if __name__ == "__main__":
    success = create_simple_competition_table()
    if success:
        print("✅ Simple competition table created successfully!")
    else:
        print("❌ Failed to create simple competition table")
        sys.exit(1)
