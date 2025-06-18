import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export const generateTerraformConfig = tool(
  async ({ resourceType, provider, config }) => {
    try {
      // Generate Terraform configuration based on best practices
      let terraformConfig = "";
      
      switch (resourceType) {
        case "vpc":
          terraformConfig = generateVPCConfig(provider, config);
          break;
        case "ec2":
          terraformConfig = generateEC2Config(provider, config);
          break;
        case "rds":
          terraformConfig = generateRDSConfig(provider, config);
          break;
        case "s3":
          terraformConfig = generateS3Config(provider, config);
          break;
        case "aks":
          terraformConfig = generateAKSConfig(provider, config);
          break;
        default:
          return { error: `Unsupported resource type: ${resourceType}` };
      }
      
      // Save to temporary file for validation
      const tempDir = path.join(process.cwd(), "temp", uuidv4());
      await fs.mkdir(tempDir, { recursive: true });
      const configPath = path.join(tempDir, "main.tf");
      await fs.writeFile(configPath, terraformConfig);
      
      return {
        success: true,
        config: terraformConfig,
        path: configPath,
        message: "Terraform configuration generated successfully"
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  },
  {
    name: "generate_terraform_config",
    description: "Generate Terraform configuration for infrastructure resources",
    schema: z.object({
      resourceType: z.enum(["vpc", "ec2", "rds", "s3", "aks"]),
      provider: z.enum(["aws", "azure", "gcp"]),
      config: z.record(z.any()).describe("Resource-specific configuration")
    })
  }
);

export const validateTerraformConfig = tool(
  async ({ configPath }) => {
    try {
      const { stdout, stderr } = await execAsync(`terraform validate`, {
        cwd: path.dirname(configPath)
      });
      
      if (stderr) {
        return { valid: false, errors: stderr };
      }
      
      return { valid: true, message: "Configuration is valid" };
    } catch (error) {
      return { valid: false, errors: error instanceof Error ? error.message : String(error) };
    }
  },
  {
    name: "validate_terraform_config",
    description: "Validate Terraform configuration syntax",
    schema: z.object({
      configPath: z.string().describe("Path to Terraform configuration file")
    })
  }
);

export const planTerraformDeployment = tool(
  async ({ configPath, workspace }) => {
    try {
      const workDir = path.dirname(configPath);
      
      // Initialize Terraform
      await execAsync(`terraform init`, { cwd: workDir });
      
      // Select workspace if specified
      if (workspace) {
        await execAsync(`terraform workspace select ${workspace} || terraform workspace new ${workspace}`, { cwd: workDir });
      }
      
      // Run terraform plan
      const { stdout } = await execAsync(`terraform plan -out=tfplan`, { cwd: workDir });
      
      // Parse plan output for summary
      const planSummary = parseTerraformPlan(stdout);
      
      return {
        success: true,
        summary: planSummary,
        planPath: path.join(workDir, "tfplan"),
        fullOutput: stdout
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  },
  {
    name: "plan_terraform_deployment",
    description: "Create and analyze Terraform deployment plan",
    schema: z.object({
      configPath: z.string(),
      workspace: z.string().optional()
    })
  }
);

// Helper functions for generating configurations
function generateVPCConfig(provider: string, config: any): string {
  if (provider === "aws") {
    return `
resource "aws_vpc" "main" {
  cidr_block           = "\${var.vpc_cidr}"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = "\${var.environment}"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-subnet-\${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "\${var.project_name}-private-subnet-\${count.index + 1}"
    Type = "Private"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-igw"
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "\${var.project_name}-nat-\${count.index + 1}"
  }
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"

  tags = {
    Name = "\${var.project_name}-nat-eip-\${count.index + 1}"
  }
}

# Security Group for VPC
resource "aws_security_group" "default" {
  name        = "\${var.project_name}-default-sg"
  description = "Default security group for VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-default-sg"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  default     = "${config.cidr || "10.0.0.0/16"}"
}

variable "project_name" {
  description = "Project name"
  default     = "${config.projectName || "careerate"}"
}

variable "environment" {
  description = "Environment name"
  default     = "${config.environment || "production"}"
}

variable "availability_zones" {
  description = "List of availability zones"
  default     = ${JSON.stringify(config.availabilityZones || ["us-west-2a", "us-west-2b"])}
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  default     = ${config.enableNatGateway !== false}
}
`;
  } else if (provider === "azure") {
    return generateAzureVPCConfig(config);
  }
  return "";
}

function generateAzureVPCConfig(config: any): string {
  return `
resource "azurerm_resource_group" "main" {
  name     = "\${var.project_name}-rg"
  location = var.location
}

resource "azurerm_virtual_network" "main" {
  name                = "\${var.project_name}-vnet"
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_subnet" "public" {
  name                 = "\${var.project_name}-public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 0)]
}

resource "azurerm_subnet" "private" {
  name                 = "\${var.project_name}-private-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 1)]
}

resource "azurerm_network_security_group" "main" {
  name                = "\${var.project_name}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowVnetInBound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  tags = {
    Environment = var.environment
  }
}

variable "vnet_cidr" {
  description = "CIDR block for VNet"
  default     = "${config.cidr || "10.0.0.0/16"}"
}

variable "project_name" {
  description = "Project name"
  default     = "${config.projectName || "careerate"}"
}

variable "environment" {
  description = "Environment name"
  default     = "${config.environment || "production"}"
}

variable "location" {
  description = "Azure location"
  default     = "${config.location || "West US 2"}"
}
`;
}

function generateEC2Config(provider: string, config: any): string {
  // Implementation for EC2/VM configs
  return "";
}

function generateRDSConfig(provider: string, config: any): string {
  // Implementation for RDS/Database configs
  return "";
}

function generateS3Config(provider: string, config: any): string {
  // Implementation for S3/Storage configs
  return "";
}

function generateAKSConfig(provider: string, config: any): string {
  // Implementation for AKS/Kubernetes configs
  return "";
}

function parseTerraformPlan(planOutput: string): any {
  // Parse terraform plan output to extract summary
  const lines = planOutput.split('\n');
  const summary = {
    toAdd: 0,
    toChange: 0,
    toDestroy: 0,
    resources: []
  };
  
  // Extract resource counts and details
  // ... parsing logic ...
  
  return summary;
}

export const terraformTools = [
  generateTerraformConfig,
  validateTerraformConfig,
  planTerraformDeployment
]; 