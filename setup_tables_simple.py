#!/usr/bin/env python3
"""
Simplified table creation for BigQuery upload infrastructure.
"""
import os
from google.cloud import bigquery

# Set up credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/Users/dallas/Source/BigQuery_7/Ajax01/backend/rentroll-ai-credentials.json'

def create_tables():
    """Create the essential tables for the upload system."""
    client = bigquery.Client(project='rentroll-ai')
    
    print("🏗️  Creating BigQuery tables...")
    
    # 1. Rent Roll History Table (simplified)
    rent_roll_schema = [
        bigquery.SchemaField("upload_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("property_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("upload_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("data_month", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("unit_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("unit", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("property", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("bedroom", "INTEGER"),
        bigquery.SchemaField("bathrooms", "FLOAT"),
        bigquery.SchemaField("sqft", "INTEGER"),
        bigquery.SchemaField("market_rent", "FLOAT"),
        bigquery.SchemaField("current_rent", "FLOAT"),
        bigquery.SchemaField("advertised_rent", "FLOAT"),
        bigquery.SchemaField("status", "STRING"),
        bigquery.SchemaField("occupancy_status", "STRING"),
        bigquery.SchemaField("tenant_name", "STRING"),
        bigquery.SchemaField("created_at", "TIMESTAMP", default_value_expression="CURRENT_TIMESTAMP()"),
    ]
    
    table_id = "rentroll-ai.uploads.rent_roll_history"
    table = bigquery.Table(table_id, schema=rent_roll_schema)
    
    try:
        table = client.create_table(table)
        print(f"✅ Created table {table.table_id}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"ℹ️  Table {table_id} already exists")
        else:
            print(f"❌ Error creating {table_id}: {e}")
    
    # 2. Competition History Table (simplified)
    competition_schema = [
        bigquery.SchemaField("upload_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("property_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("upload_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("data_month", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("comp_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("competitor_property", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("bedrooms", "STRING"),
        bigquery.SchemaField("bedrooms_normalized", "INTEGER"),
        bigquery.SchemaField("market_rent", "FLOAT"),
        bigquery.SchemaField("market_rent_psf", "FLOAT"),
        bigquery.SchemaField("avg_sq_ft", "FLOAT"),
        bigquery.SchemaField("is_available", "BOOLEAN"),
        bigquery.SchemaField("created_at", "TIMESTAMP", default_value_expression="CURRENT_TIMESTAMP()"),
    ]
    
    table_id = "rentroll-ai.uploads.competition_history"
    table = bigquery.Table(table_id, schema=competition_schema)
    
    try:
        table = client.create_table(table)
        print(f"✅ Created table {table.table_id}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"ℹ️  Table {table_id} already exists")
        else:
            print(f"❌ Error creating {table_id}: {e}")
    
    # 3. Processing Log Table
    log_schema = [
        bigquery.SchemaField("log_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("upload_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("step", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("status", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("message", "STRING"),
        bigquery.SchemaField("created_at", "TIMESTAMP", default_value_expression="CURRENT_TIMESTAMP()"),
    ]
    
    table_id = "rentroll-ai.uploads.processing_log"
    table = bigquery.Table(table_id, schema=log_schema)
    
    try:
        table = client.create_table(table)
        print(f"✅ Created table {table.table_id}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"ℹ️  Table {table_id} already exists")
        else:
            print(f"❌ Error creating {table_id}: {e}")
    
    print("\n🎉 Table creation completed!")
    
    # Test connection
    print("\n🔍 Testing BigQuery connection...")
    try:
        query = "SELECT 1 as test_value"
        query_job = client.query(query)
        result = query_job.result()
        for row in result:
            if row.test_value == 1:
                print("✅ BigQuery connection test passed")
                break
    except Exception as e:
        print(f"❌ BigQuery connection test failed: {e}")

if __name__ == "__main__":
    create_tables()
