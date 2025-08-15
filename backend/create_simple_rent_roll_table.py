#!/usr/bin/env python3

"""
Create a simplified rent roll table with only essential columns that actually exist.
"""

import sys
sys.path.append('backend')

from google.cloud import bigquery
from app.config import settings

def create_simple_rent_roll_table():
    """Create a simplified rent roll table with essential columns only."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # Define the simplified table schema
    schema = [
        bigquery.SchemaField("upload_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("property_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("upload_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("data_month", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("unit_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("unit", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("bedroom", "INTEGER", mode="NULLABLE"),
        bigquery.SchemaField("bathrooms", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("sqft", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("current_rent", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("market_rent", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("status", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("occupancy_status", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("property", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("data_quality_score", "FLOAT", mode="NULLABLE"),
    ]
    
    # Table ID
    table_id = f"{settings.gcp_project_id}.uploads.rent_roll_history_simple"
    
    # Create table
    table = bigquery.Table(table_id, schema=schema)
    table.description = "Simplified rent roll history with essential columns only"
    
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
    success = create_simple_rent_roll_table()
    if success:
        print("✅ Simple rent roll table created successfully!")
    else:
        print("❌ Failed to create simple rent roll table")
        sys.exit(1)
