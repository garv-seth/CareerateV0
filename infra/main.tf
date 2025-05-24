provider "azurerm" {
  features {}
}

variable "resource_group_name" { default = "careerate-rg" }
variable "location" { default = "West US 2" }
variable "app_name" { default = "careerate-v0" }

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_app_service_plan" "main" {
  name                = "${var.app_name}-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "Linux"
  reserved            = true
  sku {
    tier = "Standard"
    size = "S1"
  }
}

resource "azurerm_app_service" "web" {
  name                = var.app_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.main.id
  site_config {
    linux_fx_version = "NODE|18-lts"
  }
  app_settings = {
    WEBSITE_RUN_FROM_PACKAGE = 1
  }
}

resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.app_name}-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "MongoDB"
  consistency_policy {
    consistency_level = "Session"
  }
  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }
}

resource "azurerm_storage_account" "main" {
  name                     = "${var.app_name}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_redis_cache" "main" {
  name                = "${var.app_name}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "C"
  sku_name            = "Basic"
}

resource "azurerm_key_vault" "main" {
  name                        = "${var.app_name}-kv"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
}

data "azurerm_client_config" "current" {}

resource "azuread_application" "main" {
  display_name = "${var.app_name}-aad"
}

output "webapp_url" {
  value = azurerm_app_service.web.default_site_hostname
}

output "cosmosdb_connection_string" {
  value = azurerm_cosmosdb_account.main.connection_strings[0]
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "aad_app_id" {
  value = azuread_application.main.application_id
} 