"""
Configuration management for Careerate AI Platform
Handles environment variables and Azure service configuration
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "Careerate AI Platform"
    app_version: str = "2.0.0"
    debug: bool = Field(default=False, description="Enable debug mode")
    environment: str = Field(default="development", description="Environment: development, staging, production")
    
    # Database
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=5, description="Database connection pool size")
    database_max_overflow: int = Field(default=10, description="Database max overflow connections")
    
    # Redis
    redis_url: str = Field(..., description="Redis URL for caching and sessions")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    
    # Azure Services
    azure_subscription_id: Optional[str] = Field(default=None, description="Azure subscription ID")
    azure_resource_group: Optional[str] = Field(default=None, description="Azure resource group")
    azure_tenant_id: Optional[str] = Field(default=None, description="Azure tenant ID")
    azure_client_id: Optional[str] = Field(default=None, description="Azure client ID")
    azure_client_secret: Optional[str] = Field(default=None, description="Azure client secret")
    
    # Azure Key Vault
    azure_keyvault_url: Optional[str] = Field(default=None, description="Azure Key Vault URL")
    
    # Azure Cognitive Search
    azure_search_endpoint: Optional[str] = Field(default=None, description="Azure Cognitive Search endpoint")
    azure_search_key: Optional[str] = Field(default=None, description="Azure Cognitive Search API key")
    azure_search_index_name: str = Field(default="ai-tools-index", description="Search index name")
    
    # Azure OpenAI
    azure_openai_endpoint: Optional[str] = Field(default=None, description="Azure OpenAI endpoint")
    azure_openai_key: Optional[str] = Field(default=None, description="Azure OpenAI API key")
    azure_openai_version: str = Field(default="2024-02-15-preview", description="Azure OpenAI API version")
    azure_openai_deployment_name: str = Field(default="gpt-4", description="Azure OpenAI deployment name")
    
    # AI Service API Keys
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    huggingface_api_key: Optional[str] = Field(default=None, description="Hugging Face API key")
    
    # Machine Learning
    mlflow_tracking_uri: Optional[str] = Field(default=None, description="MLflow tracking server URI")
    model_registry_uri: Optional[str] = Field(default=None, description="Model registry URI")
    
    # Security
    secret_key: str = Field(..., description="Secret key for JWT and encryption")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiration")
    
    # CORS
    allowed_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:5173"], description="Allowed CORS origins")
    allowed_methods: list[str] = Field(default=["GET", "POST", "PUT", "DELETE"], description="Allowed HTTP methods")
    allowed_headers: list[str] = Field(default=["*"], description="Allowed headers")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, description="Rate limit requests per minute")
    rate_limit_window: int = Field(default=60, description="Rate limit window in seconds")
    
    # Monitoring and Logging
    log_level: str = Field(default="INFO", description="Logging level")
    azure_appinsights_connection_string: Optional[str] = Field(default=None, description="Application Insights connection string")
    prometheus_multiproc_dir: Optional[str] = Field(default=None, description="Prometheus multiprocess directory")
    
    # Chrome Extension
    chrome_extension_id: Optional[str] = Field(default=None, description="Chrome extension ID")
    extension_api_version: str = Field(default="v1", description="Extension API version")
    
    # Feature Flags
    enable_real_time_recommendations: bool = Field(default=True, description="Enable real-time recommendation streaming")
    enable_advanced_analytics: bool = Field(default=True, description="Enable advanced analytics features")
    enable_ml_model_training: bool = Field(default=False, description="Enable ML model training")
    enable_feedback_learning: bool = Field(default=True, description="Enable learning from user feedback")
    
    # AI Model Configuration
    max_tokens_per_request: int = Field(default=4000, description="Maximum tokens per AI request")
    ai_request_timeout: int = Field(default=30, description="AI request timeout in seconds")
    max_concurrent_ai_requests: int = Field(default=10, description="Maximum concurrent AI requests")
    
    # Cache Configuration
    cache_ttl_recommendations: int = Field(default=3600, description="Recommendation cache TTL in seconds")
    cache_ttl_user_profiles: int = Field(default=1800, description="User profile cache TTL in seconds")
    cache_ttl_ai_tools: int = Field(default=7200, description="AI tools cache TTL in seconds")
    
    # Vector Database
    vector_dimension: int = Field(default=384, description="Vector embedding dimension")
    similarity_threshold: float = Field(default=0.7, description="Similarity threshold for recommendations")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()

# Azure-specific configuration helpers
class AzureConfig:
    """Azure service configuration helpers"""
    
    @staticmethod
    def get_azure_credential():
        """Get Azure credential based on environment"""
        from azure.identity import DefaultAzureCredential, ClientSecretCredential
        
        settings = get_settings()
        
        if settings.azure_client_id and settings.azure_client_secret and settings.azure_tenant_id:
            return ClientSecretCredential(
                tenant_id=settings.azure_tenant_id,
                client_id=settings.azure_client_id,
                client_secret=settings.azure_client_secret
            )
        else:
            return DefaultAzureCredential()
    
    @staticmethod
    def get_keyvault_client():
        """Get Azure Key Vault client"""
        from azure.keyvault.secrets import SecretClient
        
        settings = get_settings()
        if not settings.azure_keyvault_url:
            return None
        
        credential = AzureConfig.get_azure_credential()
        return SecretClient(vault_url=settings.azure_keyvault_url, credential=credential)
    
    @staticmethod
    def get_search_client():
        """Get Azure Cognitive Search client"""
        from azure.search.documents import SearchClient
        from azure.core.credentials import AzureKeyCredential
        
        settings = get_settings()
        if not settings.azure_search_endpoint or not settings.azure_search_key:
            return None
        
        return SearchClient(
            endpoint=settings.azure_search_endpoint,
            index_name=settings.azure_search_index_name,
            credential=AzureKeyCredential(settings.azure_search_key)
        )
    
    @staticmethod
    async def get_secret_from_keyvault(secret_name: str) -> Optional[str]:
        """Get secret from Azure Key Vault"""
        try:
            client = AzureConfig.get_keyvault_client()
            if not client:
                return None
            
            secret = client.get_secret(secret_name)
            return secret.value
        except Exception as e:
            import logging
            logging.error(f"Error retrieving secret {secret_name} from Key Vault: {e}")
            return None

# Environment-specific configurations
def get_cors_config():
    """Get CORS configuration based on environment"""
    settings = get_settings()
    
    if settings.environment == "production":
        return {
            "allow_origins": ["https://gocareerate.com", "https://www.gocareerate.com"],
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Authorization", "Content-Type"]
        }
    else:
        return {
            "allow_origins": settings.allowed_origins,
            "allow_credentials": True,
            "allow_methods": settings.allowed_methods,
            "allow_headers": settings.allowed_headers
        }

def get_database_config():
    """Get database configuration with connection pooling"""
    settings = get_settings()
    
    return {
        "url": settings.database_url,
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow,
        "pool_timeout": 30,
        "pool_recycle": 3600,
        "echo": settings.debug
    }

def get_redis_config():
    """Get Redis configuration"""
    settings = get_settings()
    
    config = {
        "url": settings.redis_url,
        "decode_responses": True,
        "health_check_interval": 30
    }
    
    if settings.redis_password:
        config["password"] = settings.redis_password
    
    return config

def get_ai_service_config():
    """Get AI service configuration"""
    settings = get_settings()
    
    return {
        "openai": {
            "api_key": settings.openai_api_key,
            "max_tokens": settings.max_tokens_per_request,
            "timeout": settings.ai_request_timeout
        },
        "anthropic": {
            "api_key": settings.anthropic_api_key,
            "max_tokens": settings.max_tokens_per_request,
            "timeout": settings.ai_request_timeout
        },
        "azure_openai": {
            "endpoint": settings.azure_openai_endpoint,
            "api_key": settings.azure_openai_key,
            "api_version": settings.azure_openai_version,
            "deployment_name": settings.azure_openai_deployment_name
        },
        "max_concurrent_requests": settings.max_concurrent_ai_requests
    }

def get_monitoring_config():
    """Get monitoring and observability configuration"""
    settings = get_settings()
    
    return {
        "log_level": settings.log_level,
        "app_insights": {
            "connection_string": settings.azure_appinsights_connection_string,
            "enabled": bool(settings.azure_appinsights_connection_string)
        },
        "prometheus": {
            "multiproc_dir": settings.prometheus_multiproc_dir,
            "enabled": bool(settings.prometheus_multiproc_dir)
        }
    }

# Validation helpers
def validate_required_settings():
    """Validate that required settings are present"""
    settings = get_settings()
    required_settings = [
        ("database_url", "Database URL is required"),
        ("redis_url", "Redis URL is required"),
        ("secret_key", "Secret key is required")
    ]
    
    missing = []
    for setting_name, error_msg in required_settings:
        if not getattr(settings, setting_name, None):
            missing.append(error_msg)
    
    if missing:
        raise ValueError(f"Missing required configuration: {', '.join(missing)}")

def validate_ai_service_config():
    """Validate AI service configuration"""
    settings = get_settings()
    
    if not settings.openai_api_key and not settings.azure_openai_key:
        raise ValueError("At least one AI service (OpenAI or Azure OpenAI) must be configured")
    
    if settings.azure_openai_endpoint and not settings.azure_openai_key:
        raise ValueError("Azure OpenAI endpoint specified but no API key provided")

# Export commonly used functions
__all__ = [
    "Settings",
    "get_settings",
    "AzureConfig",
    "get_cors_config",
    "get_database_config",
    "get_redis_config",
    "get_ai_service_config",
    "get_monitoring_config",
    "validate_required_settings",
    "validate_ai_service_config"
] 