#!/usr/bin/env python3

"""
Create system tables for multi-tenant SaaS platform.
"""

import sys
sys.path.append('.')

from google.cloud import bigquery
from app.config import settings
import uuid

def create_system_tables():
    """Create system-wide tables for multi-tenant architecture."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # 1. Create system dataset
    dataset_id = f"{settings.gcp_project_id}.system"
    
    try:
        client.get_dataset(dataset_id)
        print(f"✅ System dataset already exists: {dataset_id}")
    except:
        dataset = bigquery.Dataset(dataset_id)
        dataset.location = "US"
        dataset.description = "System tables for multi-tenant SaaS platform"
        client.create_dataset(dataset)
        print(f"✅ Created system dataset: {dataset_id}")
    
    # 2. Clients table
    clients_schema = [
        bigquery.SchemaField("client_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("client_name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("dataset_name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("contact_email", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("subscription_tier", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("updated_at", "TIMESTAMP", mode="NULLABLE"),
        bigquery.SchemaField("is_active", "BOOLEAN", mode="REQUIRED"),
        bigquery.SchemaField("metadata", "JSON", mode="NULLABLE"),
    ]
    
    # 3. Users table  
    users_schema = [
        bigquery.SchemaField("user_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("client_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("auth0_user_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("email", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("role", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("first_name", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("last_name", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("last_login", "TIMESTAMP", mode="NULLABLE"),
        bigquery.SchemaField("is_active", "BOOLEAN", mode="REQUIRED"),
    ]
    
    # 4. Billing units table
    billing_schema = [
        bigquery.SchemaField("record_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("client_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("billing_month", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("unit_count", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("calculated_at", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("billing_amount", "FLOAT", mode="NULLABLE"),
        bigquery.SchemaField("metadata", "JSON", mode="NULLABLE"),
    ]
    
    # 5. Audit logs table
    audit_schema = [
        bigquery.SchemaField("log_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("client_id", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("user_id", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("action", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("resource_type", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("resource_id", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("ip_address", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("user_agent", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("details", "JSON", mode="NULLABLE"),
    ]
    
    tables = [
        ("clients", clients_schema, "Client registry and configuration"),
        ("users", users_schema, "User management and authentication"),
        ("billing_units", billing_schema, "Unit count tracking for billing"),
        ("audit_logs", audit_schema, "System audit trail"),
    ]
    
    for table_name, schema, description in tables:
        table_id = f"{dataset_id}.{table_name}"
        
        try:
            # Check if table exists
            client.get_table(table_id)
            print(f"✅ Table already exists: {table_name}")
        except:
            # Create table
            table = bigquery.Table(table_id, schema=schema)
            table.description = description
            client.create_table(table)
            print(f"✅ Created table: {table_name}")
    
    print("\n🎉 System tables ready for multi-tenant architecture!")
    return True

def create_demo_client():
    """Create a demo client for testing."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    demo_client_id = "demo_client_001"
    
    # Insert demo client
    demo_client_data = [{
        'client_id': demo_client_id,
        'client_name': 'Demo Client Properties',
        'dataset_name': f'client_{demo_client_id}',
        'contact_email': 'demo@example.com',
        'subscription_tier': 'standard',
        'created_at': bigquery.ScalarQueryParameter(None, "TIMESTAMP", "CURRENT_TIMESTAMP()"),
        'is_active': True,
        'metadata': '{"demo": true, "setup_by": "system"}'
    }]
    
    table_id = f"{settings.gcp_project_id}.system.clients"
    
    # Check if demo client already exists
    check_query = f"""
    SELECT COUNT(*) as count 
    FROM `{table_id}` 
    WHERE client_id = '{demo_client_id}'
    """
    
    result = client.query(check_query).to_dataframe()
    
    if result.iloc[0]['count'] == 0:
        # Insert demo client
        insert_query = f"""
        INSERT INTO `{table_id}` (client_id, client_name, dataset_name, contact_email, subscription_tier, created_at, is_active, metadata)
        VALUES (
            '{demo_client_id}',
            'Demo Client Properties', 
            'client_{demo_client_id}',
            'demo@example.com',
            'standard',
            CURRENT_TIMESTAMP(),
            true,
            JSON '{{"demo": true, "setup_by": "system"}}'
        )
        """
        
        client.query(insert_query).result()
        print(f"✅ Created demo client: {demo_client_id}")
        
        # Create demo client dataset
        create_client_dataset(demo_client_id)
    else:
        print(f"✅ Demo client already exists: {demo_client_id}")

def create_client_dataset(client_id: str):
    """Create a new dataset for a client."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    dataset_name = f"client_{client_id}"
    dataset_id = f"{settings.gcp_project_id}.{dataset_name}"
    
    try:
        client.get_dataset(dataset_id)
        print(f"✅ Client dataset already exists: {dataset_name}")
    except:
        # Create dataset
        dataset = bigquery.Dataset(dataset_id)
        dataset.location = "US"
        dataset.description = f"Data for client {client_id}"
        client.create_dataset(dataset)
        print(f"✅ Created client dataset: {dataset_name}")
        
        # Create client-specific tables
        create_client_tables(dataset_id)

def create_client_tables(dataset_id: str):
    """Create standard tables for a client dataset."""
    
    client = bigquery.Client(project=settings.gcp_project_id)
    
    # Copy our current table structures but client-specific
    tables_to_create = [
        ("rent_roll_uploads", "Raw rent roll uploads"),
        ("competition_uploads", "Raw competition uploads"), 
        ("analytics_rent_roll", "Analytics-ready rent roll data"),
        ("analytics_competition", "Analytics-ready competition data"),
        ("upload_metadata", "Upload history and metadata"),
    ]
    
    for table_name, description in tables_to_create:
        table_id = f"{dataset_id}.{table_name}"
        
        # Copy structure from existing upload tables
        if "rent_roll" in table_name:
            source_table = f"{settings.gcp_project_id}.uploads.rent_roll_history_simple"
        elif "competition" in table_name:
            source_table = f"{settings.gcp_project_id}.uploads.competition_history_simple"
        elif "metadata" in table_name:
            source_table = f"{settings.gcp_project_id}.uploads.upload_metadata"
        else:
            continue
            
        # Create table with same schema as source
        try:
            source = client.get_table(source_table)
            table = bigquery.Table(table_id, schema=source.schema)
            table.description = description
            client.create_table(table)
            print(f"   ✅ Created {table_name}")
        except Exception as e:
            print(f"   ⚠️ Could not create {table_name}: {e}")

if __name__ == "__main__":
    print("🚀 Setting up multi-tenant system tables...")
    
    success = create_system_tables()
    
    if success:
        print("\n🎯 Creating demo client...")
        create_demo_client()
        
        print("\n✅ Multi-tenant system ready!")
        print("\nNext steps:")
        print("1. Set up Auth0 authentication")
        print("2. Implement client context middleware")
        print("3. Update upload system for multi-tenancy")
    else:
        print("\n❌ System setup failed")
        sys.exit(1)
