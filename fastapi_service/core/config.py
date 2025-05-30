"""
Configuration management for Careerate AI Platform
Handles environment variables and Azure service configuration
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from functools import lru_cache
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "Careerate AI Platform"
    app_version: str = "2.0.0"
    debug: bool = False
    environment: str = "development"
    PROJECT_NAME: str = "Careerate AI Service - DevOps MVP"
    API_V1_STR: str = "/api/v1"
    
    # Database (PostgreSQL)
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/careerate_devops_mvp_db"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO_LOG: bool = False

    # Redis
    REDIS_HOST: Optional[str] = "localhost"
    REDIS_PORT: Optional[int] = 6379
    redis_password: Optional[str] = None
    REDIS_DB: Optional[int] = 0
    
    # Azure Services (Ensure these are used if Azure services beyond KeyVault and OpenAI are directly interfaced)
    azure_subscription_id: Optional[str] = None
    azure_resource_group: Optional[str] = None
    azure_tenant_id: Optional[str] = None
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    
    # Azure Key Vault
    AZURE_KEY_VAULT_URI: Optional[str] = None
    
    # Azure Cognitive Search (If used by MVP)
    azure_search_endpoint: Optional[str] = None
    azure_search_key: Optional[str] = None
    azure_search_index_name: str = "devops-tools-index"
    
    # Azure OpenAI (If used alongside or as fallback to Gemini)
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_API_VERSION: Optional[str] = "2023-07-01-preview"
    AZURE_OPENAI_DEPLOYMENT_NAME: Optional[str] = "gpt-4o-mini-deployment"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: Optional[str] = None

    # Other AI Service API Keys (If any are used as fallbacks or for specific features)
    openai_api_key: Optional[str] = None
    OPENAI_CHAT_MODEL_NAME: str = "gpt-4o-mini"
    anthropic_api_key: Optional[str] = None
    
    # LangGraph Agent Settings (Primary AI for MVP)
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-preview-05-20"
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: Optional[str] = "us-central1"

    # Machine Learning (If MLFlow or a custom model registry is part of MVP DevOps focus)
    mlflow_tracking_uri: Optional[str] = None
    model_registry_uri: Optional[str] = None
    
    # Security (These were from the original structure, review if Node.js API handles all auth)
    JWT_SECRET_KEY: Optional[str] = "a_temp_dev_secret_for_fastapi_mvp"
    JWT_ALGORITHM: Optional[str] = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: Optional[int] = 60 * 24
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
    
    # Rate Limiting (If applied at FastAPI level)
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # Monitoring and Logging
    log_level: str = "INFO"
    azure_appinsights_connection_string: Optional[str] = None
    
    # Cache Configuration (If Redis is used for caching agent responses or tool results)
    CACHE_ENABLED: bool = True
    CACHE_DEFAULT_TTL_SECONDS: int = 3600

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = 'ignore'

@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings, loading from .env and Azure Key Vault if configured."""
    logger.info("Loading application settings...")
    
    base_settings = Settings()

    key_vault_uri = base_settings.AZURE_KEY_VAULT_URI
    if not key_vault_uri and hasattr(base_settings, 'azure_keyvault_url') and base_settings.azure_keyvault_url:
        key_vault_uri = base_settings.azure_keyvault_url
        logger.warning("Found Key Vault URI in 'azure_keyvault_url'. Consider renaming to 'AZURE_KEY_VAULT_URI' in .env")

    if key_vault_uri:
        logger.info(f"Attempting to load secrets from Azure Key Vault: {key_vault_uri}")
        try:
            credential = DefaultAzureCredential()
            secret_client = SecretClient(vault_url=key_vault_uri, credential=credential)
            
            secret_names_map = {
                "PROJECT_NAME": "PROJECT-NAME",
                "DEBUG": "DEBUG-FLAG",
                "database_url": "DATABASE-URL-ASYNC",
                "DB_POOL_TIMEOUT": "DB-POOL-TIMEOUT",
                "DB_ECHO_LOG": "DB-ECHO-LOG",
                "REDIS_HOST": "REDIS-HOST",
                "REDIS_PORT": "REDIS-PORT",
                "redis_password": "REDIS-PASSWORD",
                "REDIS_DB": "REDIS-DB",
                "azure_subscription_id": "AZURE-SUBSCRIPTION-ID",
                "azure_resource_group": "AZURE-RESOURCE-GROUP",
                "azure_tenant_id": "AZURE-TENANT-ID",
                "azure_client_id": "AZURE-CLIENT-ID",
                "azure_client_secret": "AZURE-CLIENT-SECRET",
                "AZURE_OPENAI_ENDPOINT": "AZURE-OPENAI-ENDPOINT",
                "AZURE_OPENAI_API_KEY": "AZURE-OPENAI-API-KEY",
                "AZURE_OPENAI_API_VERSION": "AZURE-OPENAI-API-VERSION",
                "AZURE_OPENAI_DEPLOYMENT_NAME": "AZURE-OPENAI-DEPLOYMENT-NAME",
                "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME": "AZURE-OPENAI-EMBEDDING-DEPLOYMENT-NAME",
                "openai_api_key": "OPENAI-API-KEY",
                "OPENAI_CHAT_MODEL_NAME": "OPENAI-CHAT-MODEL-NAME",
                "anthropic_api_key": "ANTHROPIC-API-KEY",
                "GEMINI_MODEL_NAME": "GEMINI-MODEL-NAME",
                "GOOGLE_CLOUD_PROJECT": "GOOGLE-CLOUD-PROJECT",
                "GOOGLE_CLOUD_LOCATION": "GOOGLE-CLOUD-LOCATION",
                "JWT_SECRET_KEY": "FASTAPI-JWT-SECRET-KEY",
                "azure_appinsights_connection_string": "AZURE-APPINSIGHTS-CONNECTION-STRING",
                "CACHE_ENABLED": "CACHE-ENABLED",
                "CACHE_DEFAULT_TTL_SECONDS": "CACHE-DEFAULT-TTL-SECONDS",
            }
            
            updated_values = {}
            for attr_name, secret_name in secret_names_map.items():
                if hasattr(base_settings, attr_name):
                    try:
                        secret_value_obj = secret_client.get_secret(secret_name)
                        secret_value_str = secret_value_obj.value
                        if secret_value_str is not None:
                            field_info = Settings.model_fields.get(attr_name)
                            if field_info:
                                field_type = field_info.annotation
                                if field_type == Optional[int] or field_type == int:
                                    coerced_value = int(secret_value_str)
                                elif field_type == Optional[bool] or field_type == bool:
                                    coerced_value = secret_value_str.lower() in ['true', '1', 'yes']
                                elif field_type == Optional[List[str]] or field_type == List[str]:
                                    coerced_value = [s.strip() for s in secret_value_str.split(',')]
                                elif field_type == Optional[float] or field_type == float:
                                    coerced_value = float(secret_value_str)
                                else:
                                    coerced_value = secret_value_str
                                
                                updated_values[attr_name] = coerced_value
                                logger.info(f"Successfully loaded and typed secret: '{secret_name}' for '{attr_name}' from Key Vault.")
                            else:
                                logger.warning(f"Field info for '{attr_name}' not found, cannot determine type for KV secret '{secret_name}'. Storing as string.")
                                updated_values[attr_name] = secret_value_str                                
                        else:
                            logger.warning(f"Secret '{secret_name}' (for '{attr_name}') fetched from Key Vault is None. Will use default or .env value if any.")
                    except Exception as e:
                        logger.warning(f"Could not retrieve or type secret '{secret_name}' (for '{attr_name}') from Azure Key Vault: {str(e)}. "
                                       f"Falling back to .env or default for this secret.")
                else:
                    logger.warning(f"Attribute '{attr_name}' in secret_names_map not found in Settings model. Check mapping.")

            if updated_values:
                current_env_values = base_settings.model_dump()
                for key, value in updated_values.items():
                    current_env_values[key] = value
                
                try:
                    final_settings = Settings(**current_env_values)
                    logger.info("Settings successfully (re)validated with values from Azure Key Vault.")
                    logger.debug(f"Final DB URL (Async): {final_settings.database_url}")
                    logger.debug(f"Final Gemini Model: {final_settings.GEMINI_MODEL_NAME}")
                    logger.debug(f"Final GCP Project: {final_settings.GOOGLE_CLOUD_PROJECT}")
                    return final_settings
                except Exception as e:
                    logger.error(f"Pydantic validation error after applying Key Vault secrets: {e}. Check types and required fields. Using settings from .env or defaults.")
                    return base_settings
            else:
                logger.info("No secrets were updated from Azure Key Vault (no new values found or applicable). Using .env or defaults.")
                return base_settings

        except Exception as e:
            logger.error(f"Failed to connect to Azure Key Vault or critical error during secret processing: {e}. "
                         "Proceeding with settings from .env file or defaults.")
            return base_settings
    else:
        logger.info("AZURE_KEY_VAULT_URI not set. Loading settings from .env file or defaults only.")
        logger.debug(f".env DB URL (Async): {base_settings.database_url}")
        logger.debug(f".env Gemini Model: {base_settings.GEMINI_MODEL_NAME}")
        logger.debug(f".env GCP Project: {base_settings.GOOGLE_CLOUD_PROJECT}")
        return base_settings

settings = get_settings()

class AzureConfig:
    """Azure service configuration helpers"""
    
    @staticmethod
    def get_azure_credential():
        """Get Azure credential based on environment"""
        if settings.azure_client_id and settings.azure_client_secret and settings.azure_tenant_id:
            logger.info("Using ClientSecretCredential for Azure services.")
            return ClientSecretCredential(
                tenant_id=settings.azure_tenant_id,
                client_id=settings.azure_client_id,
                client_secret=settings.azure_client_secret
            )
        else:
            logger.info("Using DefaultAzureCredential for Azure services.")
            return DefaultAzureCredential()

    @staticmethod
    def get_keyvault_client():
        """Get Azure Key Vault client"""
        if not settings.AZURE_KEY_VAULT_URI:
            logger.warning("Azure Key Vault URI not configured, cannot create Key Vault client.")
            return None
        credential = AzureConfig.get_azure_credential()
        return SecretClient(vault_url=settings.AZURE_KEY_VAULT_URI, credential=credential)

    @staticmethod
    def get_search_client():
        """Get Azure Cognitive Search client"""
        if not settings.azure_search_endpoint or not settings.azure_search_key:
            logger.warning("Azure Search endpoint or key not configured, cannot create Search client.")
            return None
        from azure.core.credentials import AzureKeyCredential
        from azure.search.documents.aio import SearchClient
        
        credential = AzureKeyCredential(settings.azure_search_key)
        return SearchClient(endpoint=settings.azure_search_endpoint,
                              index_name=settings.azure_search_index_name,
                              credential=credential)

    @staticmethod
    async def get_secret_from_keyvault(secret_name: str) -> Optional[str]:
        """Retrieve a specific secret from Azure Key Vault asynchronously."""
        if not settings.AZURE_KEY_VAULT_URI:
            logger.warning(f"Cannot fetch secret '{secret_name}': Azure Key Vault URI not set.")
            return None
        try:
            sync_credential = DefaultAzureCredential()
            sync_secret_client = SecretClient(vault_url=settings.AZURE_KEY_VAULT_URI, credential=sync_credential)
            secret = sync_secret_client.get_secret(secret_name)
            logger.info(f"Secret '{secret_name}' retrieved successfully from Key Vault on-demand.")
            return secret.value
        except Exception as e:
            logger.error(f"Error retrieving secret '{secret_name}' on-demand from Key Vault: {e}")
            return None

def get_cors_config() -> dict:
    """Get CORS configuration for FastAPI"""
    return {
        "allow_origins": settings.CORS_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }

def get_database_config() -> dict:
    """Get database configuration parameters"""
    return {
        "db_url": settings.database_url,
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "echo": settings.DB_ECHO_LOG
    }

def get_redis_config() -> Optional[dict]:
    """Get Redis configuration parameters if enabled"""
    if settings.REDIS_HOST and settings.REDIS_PORT is not None:
        return {
            "host": settings.REDIS_HOST,
            "port": settings.REDIS_PORT,
            "password": settings.redis_password,
            "db": settings.REDIS_DB,
            "decode_responses": True
        }
    return None

def validate_required_settings():
    """Validate that essential settings are present"""
    logger.info("Validating required application settings...")
    required = {
        "database_url": settings.database_url,
        "GEMINI_MODEL_NAME": settings.GEMINI_MODEL_NAME,
        "OPENAI_CHAT_MODEL_NAME": settings.OPENAI_CHAT_MODEL_NAME,
        "GOOGLE_CLOUD_PROJECT": settings.GOOGLE_CLOUD_PROJECT,
    }
    missing = [name for name, value in required.items() if value is None]
    if missing:
        logger.critical(f"Missing critical application settings: {', '.join(missing)}. Application may not run correctly.")
    else:
        logger.info("All critical settings seem to be present.")

validate_required_settings()

logger.info("FastAPI Service configuration loaded and validated.")
logger.info(f"Project: {settings.PROJECT_NAME}, Environment: {settings.environment}, Debug: {settings.debug}")
logger.info(f"Using Gemini Model: {settings.GEMINI_MODEL_NAME} in GCP Project: {settings.GOOGLE_CLOUD_PROJECT} ({settings.GOOGLE_CLOUD_LOCATION})")
logger.info(f"Using OpenAI Chat Model: {settings.OPENAI_CHAT_MODEL_NAME}") 