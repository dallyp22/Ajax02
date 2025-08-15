#!/usr/bin/env python3
"""
Setup script for BigQuery upload infrastructure.
Run this script to create all necessary BigQuery datasets and tables for the upload system.
"""
import os
import sys
from pathlib import Path
from google.cloud import bigquery
from google.cloud.exceptions import NotFound, Conflict

# Add the backend directory to Python path to import app modules
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

try:
    from app.config import settings
except ImportError:
    # Fallback configuration if app.config is not available
    class Settings:
        gcp_project_id = os.getenv('GCP_PROJECT_ID', 'rentroll-ai')
    
    settings = Settings()


def setup_bigquery_infrastructure():
    """Setup BigQuery datasets and tables for upload system."""
    print("🏗️  Setting up BigQuery Upload Infrastructure...")
    print(f"Project: {settings.gcp_project_id}")
    
    # Initialize BigQuery client
    client = bigquery.Client(project=settings.gcp_project_id)
    
    try:
        # Read and execute the SQL setup script
        sql_file_path = Path(__file__).parent.parent / "sql" / "setup_uploads_infrastructure.sql"
        
        if not sql_file_path.exists():
            raise FileNotFoundError(f"SQL setup file not found: {sql_file_path}")
        
        print(f"📄 Reading SQL setup file: {sql_file_path}")
        
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
        
        # Split SQL content into individual statements
        # Remove comments and empty lines
        statements = []
        current_statement = []
        
        for line in sql_content.split('\n'):
            line = line.strip()
            
            # Skip comments and empty lines
            if line.startswith('--') or not line:
                continue
            
            current_statement.append(line)
            
            # If line ends with semicolon, it's the end of a statement
            if line.endswith(';'):
                statement = ' '.join(current_statement)
                if statement.strip() and not statement.strip().startswith('--'):
                    statements.append(statement)
                current_statement = []
        
        # Add any remaining statement
        if current_statement:
            statement = ' '.join(current_statement)
            if statement.strip() and not statement.strip().startswith('--'):
                statements.append(statement)
        
        print(f"📊 Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        successful_statements = 0
        for i, statement in enumerate(statements, 1):
            try:
                print(f"⏳ Executing statement {i}/{len(statements)}...")
                
                # Skip GRANT statements for now (they need manual configuration)
                if 'GRANT' in statement.upper():
                    print(f"⚠️  Skipping GRANT statement (requires manual setup)")
                    continue
                
                query_job = client.query(statement)
                query_job.result()  # Wait for completion
                
                successful_statements += 1
                print(f"✅ Statement {i} completed successfully")
                
            except Conflict as e:
                if "already exists" in str(e).lower():
                    print(f"ℹ️  Statement {i} - Resource already exists, continuing...")
                    successful_statements += 1
                else:
                    print(f"❌ Statement {i} failed with conflict: {e}")
            except Exception as e:
                print(f"❌ Statement {i} failed: {e}")
                print(f"   Statement: {statement[:100]}...")
        
        print(f"\n🎉 Infrastructure setup completed!")
        print(f"✅ Successfully executed {successful_statements}/{len(statements)} statements")
        
        # Verify the setup
        print("\n🔍 Verifying setup...")
        verify_setup(client)
        
    except Exception as e:
        print(f"❌ Error setting up BigQuery infrastructure: {e}")
        sys.exit(1)


def verify_setup(client):
    """Verify that all required datasets and tables were created."""
    required_tables = [
        f"{settings.gcp_project_id}.uploads.upload_metadata",
        f"{settings.gcp_project_id}.uploads.rent_roll_history", 
        f"{settings.gcp_project_id}.uploads.competition_history",
        f"{settings.gcp_project_id}.uploads.processing_log"
    ]
    
    required_views = [
        f"{settings.gcp_project_id}.analytics.monthly_portfolio_summary",
        f"{settings.gcp_project_id}.analytics.competition_benchmarks",
        f"{settings.gcp_project_id}.analytics.data_quality_summary"
    ]
    
    print("📋 Checking required tables...")
    for table_id in required_tables:
        try:
            table = client.get_table(table_id)
            print(f"✅ Table exists: {table_id} ({table.num_rows} rows)")
        except NotFound:
            print(f"❌ Table missing: {table_id}")
    
    print("\n📋 Checking required views...")
    for view_id in required_views:
        try:
            view = client.get_table(view_id)
            print(f"✅ View exists: {view_id}")
        except NotFound:
            print(f"❌ View missing: {view_id}")
    
    print("\n📋 Testing BigQuery connection...")
    try:
        test_query = "SELECT 1 as test_value"
        query_job = client.query(test_query)
        result = query_job.result()
        for row in result:
            if row.test_value == 1:
                print("✅ BigQuery connection test passed")
                break
    except Exception as e:
        print(f"❌ BigQuery connection test failed: {e}")


def main():
    """Main entry point."""
    print("🚀 AI Rent Optimizer - Upload Infrastructure Setup")
    print("=" * 60)
    
    # Check environment variables
    required_env_vars = ['GOOGLE_APPLICATION_CREDENTIALS', 'GCP_PROJECT_ID']
    missing_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these environment variables and try again.")
        sys.exit(1)
    
    print(f"✅ Environment check passed")
    print(f"   Project ID: {settings.gcp_project_id}")
    print(f"   Credentials: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")
    
    # Setup infrastructure
    setup_bigquery_infrastructure()
    
    print("\n🎯 Next Steps:")
    print("1. Update your service account permissions if needed:")
    print(f"   gcloud projects add-iam-policy-binding {settings.gcp_project_id} \\")
    print(f"     --member=\"serviceAccount:your-service-account@{settings.gcp_project_id}.iam.gserviceaccount.com\" \\")
    print(f"     --role=\"roles/bigquery.dataEditor\"")
    print("")
    print("2. Test the upload endpoints:")
    print("   curl -X POST http://localhost:8000/api/v1/uploads/rent-roll \\")
    print("     -F 'file=@your-rent-roll.csv' \\")
    print("     -F 'property_id=test_property' \\")
    print("     -F 'data_month=2024-12'")
    print("")
    print("3. Check the upload history:")
    print("   curl http://localhost:8000/api/v1/uploads/history")
    
    print("\n✨ Upload infrastructure is ready!")


if __name__ == "__main__":
    main()
