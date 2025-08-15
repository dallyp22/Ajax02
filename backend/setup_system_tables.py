#!/usr/bin/env python3
"""
Setup system tables in BigQuery for multi-tenant SaaS platform.
This script is designed to work in both local and Railway environments.
"""

import sys
import os
sys.path.append('.')

from google.cloud import bigquery
from app.config import settings

def setup_system_tables():
    """Setup system tables in BigQuery."""
    
    print("🔍 Initializing BigQuery client...")
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # Read and execute the SQL file
    sql_file_path = os.path.join(os.path.dirname(__file__), 'create_system_tables.sql')
    
    print(f"📄 Reading SQL from: {sql_file_path}")
    with open(sql_file_path, 'r') as f:
        sql_content = f.read()
    
    # Split SQL by semicolons and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    print(f"📊 Executing {len(statements)} SQL statements...")
    
    for i, statement in enumerate(statements, 1):
        if not statement:
            continue
            
        print(f"   {i}. Executing statement...")
        try:
            query_job = client.query(statement)
            result = query_job.result()  # Wait for completion
            print(f"   ✅ Statement {i} completed successfully")
        except Exception as e:
            print(f"   ⚠️ Statement {i} failed: {e}")
            # Continue with other statements
    
    print("\n🎉 System tables setup complete!")
    
    # Verify tables exist
    print("\n🔍 Verifying created tables...")
    tables_to_check = ['clients', 'users', 'billing_units', 'audit_logs']
    
    for table_name in tables_to_check:
        try:
            table_id = f"{settings.gcp_project_id}.system.{table_name}"
            table = client.get_table(table_id)
            print(f"   ✅ {table_name}: {table.num_rows} rows")
        except Exception as e:
            print(f"   ❌ {table_name}: Not found or error - {e}")

if __name__ == "__main__":
    print("🚀 Setting up multi-tenant system tables...")
    setup_system_tables()
