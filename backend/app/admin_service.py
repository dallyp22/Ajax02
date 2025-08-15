"""
Super Admin Service for Multi-Tenant Client Management
"""
import uuid
from datetime import datetime
from typing import List, Optional
from google.cloud import bigquery
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)

# Pydantic Models for Admin Operations
class CreateClientRequest(BaseModel):
    client_name: str  # This will be the company name
    contact_email: EmailStr
    subscription_tier: str = "standard"  # Changed from plan_type

class ClientInfo(BaseModel):
    client_id: str
    client_name: str
    contact_email: str
    subscription_tier: str
    dataset_name: str
    created_at: datetime
    is_active: bool
    metadata: Optional[dict] = None

class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    client_id: str
    role: str = "client_user"  # client_admin, client_user

class UserInfo(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    client_id: str
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool

class AdminService:
    def __init__(self):
        self.client = bigquery.Client()
        self.project_id = "rentroll-ai"
    
    async def create_client(self, request: CreateClientRequest) -> ClientInfo:
        """Create a new client with isolated BigQuery dataset"""
        try:
            # Generate unique client ID and dataset name
            client_id = str(uuid.uuid4())
            dataset_name = f"client_{client_id.replace('-', '_')}"
            
            # 1. Create BigQuery dataset for the client
            await self._create_client_dataset(dataset_name)
            
            # 2. Insert client record into system.clients table
            client_info = {
                "client_id": client_id,
                "client_name": request.client_name,
                "contact_email": request.contact_email,
                "subscription_tier": request.subscription_tier,
                "dataset_name": dataset_name,
                "created_at": datetime.utcnow().isoformat(),
                "is_active": True,
                "metadata": None
            }
            
            # Insert into system.clients table
            table_ref = self.client.dataset("system").table("clients")
            errors = self.client.insert_rows_json(table_ref, [client_info])
            
            if errors:
                raise Exception(f"Failed to insert client: {errors}")
            
            logger.info(f"Created new client: {client_id} - {request.client_name}")
            
            return ClientInfo(**client_info)
            
        except Exception as e:
            logger.error(f"Error creating client: {str(e)}")
            raise
    
    async def _create_client_dataset(self, dataset_name: str):
        """Create BigQuery dataset and tables for a new client"""
        try:
            # Create dataset
            dataset_id = f"{self.project_id}.{dataset_name}"
            dataset = bigquery.Dataset(dataset_id)
            dataset.location = "US"
            dataset.description = f"Client-specific dataset for {dataset_name}"
            
            dataset = self.client.create_dataset(dataset, exists_ok=True)
            logger.info(f"Created dataset: {dataset_name}")
            
            # Create essential tables for the client
            await self._create_client_tables(dataset_name)
            
        except Exception as e:
            logger.error(f"Error creating dataset {dataset_name}: {str(e)}")
            raise
    
    async def _create_client_tables(self, dataset_name: str):
        """Create standard tables for a new client dataset"""
        tables_sql = {
            "rent_roll_history": f"""
            CREATE TABLE IF NOT EXISTS `{self.project_id}.{dataset_name}.rent_roll_history` (
                upload_id STRING,
                property_id STRING,
                unit_number STRING,
                unit_type STRING,
                bedrooms INT64,
                bathrooms FLOAT64,
                sqft FLOAT64,
                current_rent FLOAT64,
                market_rent FLOAT64,
                lease_start_date DATE,
                lease_end_date DATE,
                tenant_name STRING,
                upload_date TIMESTAMP,
                data_month STRING
            )
            """,
            
            "competition_history": f"""
            CREATE TABLE IF NOT EXISTS `{self.project_id}.{dataset_name}.competition_history` (
                upload_id STRING,
                property_name STRING,
                address STRING,
                unit_type STRING,
                bedrooms INT64,
                bathrooms FLOAT64,
                sqft FLOAT64,
                rent FLOAT64,
                availability STRING,
                upload_date TIMESTAMP,
                data_month STRING
            )
            """,
            
            "upload_metadata": f"""
            CREATE TABLE IF NOT EXISTS `{self.project_id}.{dataset_name}.upload_metadata` (
                upload_id STRING,
                upload_type STRING,
                filename STRING,
                upload_date TIMESTAMP,
                data_month STRING,
                record_count INT64,
                status STRING,
                validation_errors STRING,
                validation_warnings STRING
            )
            """
        }
        
        for table_name, sql in tables_sql.items():
            try:
                job = self.client.query(sql)
                job.result()  # Wait for completion
                logger.info(f"Created table: {dataset_name}.{table_name}")
            except Exception as e:
                logger.error(f"Error creating table {table_name}: {str(e)}")
                raise
    
    async def list_clients(self) -> List[ClientInfo]:
        """List all clients"""
        try:
            query = """
            SELECT 
                client_id,
                client_name,
                contact_email,
                subscription_tier,
                dataset_name,
                created_at,
                is_active,
                metadata
            FROM `rentroll-ai.system.clients`
            ORDER BY created_at DESC
            """
            
            results = self.client.query(query).result()
            clients = []
            
            for row in results:
                # Parse metadata JSON string to dict
                metadata = row.metadata
                if isinstance(metadata, str):
                    import json
                    try:
                        metadata = json.loads(metadata)
                    except (json.JSONDecodeError, TypeError):
                        metadata = {}
                
                clients.append(ClientInfo(
                    client_id=row.client_id,
                    client_name=row.client_name,
                    contact_email=row.contact_email,
                    subscription_tier=row.subscription_tier,
                    dataset_name=row.dataset_name,
                    created_at=row.created_at,
                    is_active=row.is_active,
                    metadata=metadata
                ))
            
            return clients
            
        except Exception as e:
            logger.error(f"Error listing clients: {str(e)}")
            raise
    
    async def get_client(self, client_id: str) -> Optional[ClientInfo]:
        """Get specific client details"""
        try:
            query = """
            SELECT 
                client_id,
                company_name,
                contact_email,
                contact_name,
                plan_type,
                dataset_name,
                created_at,
                status,
                total_units,
                last_upload
            FROM `rentroll-ai.system.clients`
            WHERE client_id = @client_id
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("client_id", "STRING", client_id)
                ]
            )
            
            results = self.client.query(query, job_config=job_config).result()
            
            for row in results:
                return ClientInfo(
                    client_id=row.client_id,
                    company_name=row.company_name,
                    contact_email=row.contact_email,
                    contact_name=row.contact_name,
                    plan_type=row.plan_type,
                    dataset_name=row.dataset_name,
                    created_at=row.created_at,
                    status=row.status,
                    total_units=row.total_units,
                    last_upload=row.last_upload
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting client {client_id}: {str(e)}")
            raise
    
    async def create_user(self, request: CreateUserRequest) -> UserInfo:
        """Create a new user for a client"""
        try:
            # Verify client exists
            client = await self.get_client(request.client_id)
            if not client:
                raise ValueError(f"Client {request.client_id} not found")
            
            user_id = str(uuid.uuid4())
            user_info = {
                "user_id": user_id,
                "email": request.email,
                "first_name": request.first_name,
                "last_name": request.last_name,
                "client_id": request.client_id,
                "role": request.role,
                "created_at": datetime.utcnow().isoformat(),
                "auth0_user_id": "pending",  # Will be populated when user first logs in
                "is_active": True
            }
            
            # Insert into system.users table
            table_ref = self.client.dataset("system").table("users")
            errors = self.client.insert_rows_json(table_ref, [user_info])
            
            if errors:
                raise Exception(f"Failed to insert user: {errors}")
            
            logger.info(f"Created new user: {user_id} - {request.email}")
            
            return UserInfo(**user_info)
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    async def list_users(self, client_id: Optional[str] = None) -> List[UserInfo]:
        """List users, optionally filtered by client"""
        try:
            if client_id:
                query = """
                SELECT user_id, email, first_name, last_name, client_id, role, created_at, last_login, is_active
                FROM `rentroll-ai.system.users`
                WHERE client_id = @client_id
                ORDER BY created_at DESC
                """
                job_config = bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("client_id", "STRING", client_id)
                    ]
                )
            else:
                query = """
                SELECT user_id, email, first_name, last_name, client_id, role, created_at, last_login, is_active
                FROM `rentroll-ai.system.users`
                ORDER BY created_at DESC
                """
                job_config = None
            
            results = self.client.query(query, job_config=job_config).result()
            users = []
            
            for row in results:
                users.append(UserInfo(
                    user_id=row.user_id,
                    email=row.email,
                    first_name=row.first_name,
                    last_name=row.last_name,
                    client_id=row.client_id,
                    role=row.role,
                    created_at=row.created_at,
                    last_login=row.last_login,
                    is_active=row.is_active
                ))
            
            return users
            
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            raise
    
    async def update_client_status(self, client_id: str, status: str):
        """Update client status (active, suspended, etc.)"""
        try:
            query = """
            UPDATE `rentroll-ai.system.clients`
            SET status = @status
            WHERE client_id = @client_id
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("status", "STRING", status),
                    bigquery.ScalarQueryParameter("client_id", "STRING", client_id)
                ]
            )
            
            job = self.client.query(query, job_config=job_config)
            job.result()  # Wait for completion
            
            logger.info(f"Updated client {client_id} status to {status}")
            
        except Exception as e:
            logger.error(f"Error updating client status: {str(e)}")
            raise
