#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

class TerraformMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "careerate-terraform-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "terraform_validate",
            description: "Validate Terraform configuration syntax and logic",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Terraform configuration to validate",
                },
                workingDir: {
                  type: "string",
                  description: "Working directory (optional)",
                },
              },
              required: ["config"],
            },
          },
          {
            name: "terraform_plan",
            description: "Generate Terraform execution plan",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Terraform configuration",
                },
                variables: {
                  type: "object",
                  description: "Terraform variables",
                },
                workingDir: {
                  type: "string",
                  description: "Working directory (optional)",
                },
              },
              required: ["config"],
            },
          },
          {
            name: "terraform_fmt",
            description: "Format Terraform configuration",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Terraform configuration to format",
                },
              },
              required: ["config"],
            },
          },
          {
            name: "terraform_analyze_state",
            description: "Analyze Terraform state file",
            inputSchema: {
              type: "object",
              properties: {
                statePath: {
                  type: "string",
                  description: "Path to Terraform state file",
                },
              },
              required: ["statePath"],
            },
          },
          {
            name: "terraform_security_scan",
            description: "Scan Terraform configuration for security issues",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Terraform configuration to scan",
                },
              },
              required: ["config"],
            },
          },
          {
            name: "terraform_cost_estimate",
            description: "Estimate infrastructure costs",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Terraform configuration",
                },
                provider: {
                  type: "string",
                  enum: ["aws", "azure", "gcp"],
                  description: "Cloud provider",
                },
              },
              required: ["config", "provider"],
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "terraform_validate":
            return await this.validateTerraform(args);
          case "terraform_plan":
            return await this.planTerraform(args);
          case "terraform_fmt":
            return await this.formatTerraform(args);
          case "terraform_analyze_state":
            return await this.analyzeState(args);
          case "terraform_security_scan":
            return await this.securityScan(args);
          case "terraform_cost_estimate":
            return await this.costEstimate(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async validateTerraform(args: any) {
    const { config, workingDir } = args;
    const tempDir = workingDir || await fs.mkdtemp(path.join(os.tmpdir(), "tf-validate-"));

    try {
      // Write config to temporary file
      const configPath = path.join(tempDir, "main.tf");
      await fs.writeFile(configPath, config);

      // Initialize Terraform
      await execAsync("terraform init", { cwd: tempDir });

      // Validate configuration
      const { stdout, stderr } = await execAsync("terraform validate -json", {
        cwd: tempDir,
      });

      const result = JSON.parse(stdout);

      if (!workingDir) {
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: result.valid,
              diagnostics: result.diagnostics,
              summary: result.valid ? "Configuration is valid" : "Configuration has errors",
            }, null, 2),
          },
        ],
        isError: !result.valid,
      };
    } catch (error) {
      if (!workingDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
      throw error;
    }
  }

  private async planTerraform(args: any) {
    const { config, variables = {}, workingDir } = args;
    const tempDir = workingDir || await fs.mkdtemp(path.join(os.tmpdir(), "tf-plan-"));

    try {
      // Write config and variables
      const configPath = path.join(tempDir, "main.tf");
      await fs.writeFile(configPath, config);

      if (Object.keys(variables).length > 0) {
        const varsPath = path.join(tempDir, "terraform.tfvars.json");
        await fs.writeFile(varsPath, JSON.stringify(variables, null, 2));
      }

      // Initialize Terraform
      await execAsync("terraform init", { cwd: tempDir });

      // Generate plan
      const { stdout, stderr } = await execAsync("terraform plan -out=plan.out -no-color", {
        cwd: tempDir,
      });

      // Get plan in JSON format
      const { stdout: planJson } = await execAsync("terraform show -json plan.out", {
        cwd: tempDir,
      });

      if (!workingDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              planOutput: stdout,
              planJson: JSON.parse(planJson),
              summary: "Plan generated successfully",
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (!workingDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
      throw error;
    }
  }

  private async formatTerraform(args: any) {
    const { config } = args;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tf-fmt-"));

    try {
      const configPath = path.join(tempDir, "main.tf");
      await fs.writeFile(configPath, config);

      await execAsync("terraform fmt", { cwd: tempDir });

      const formattedConfig = await fs.readFile(configPath, "utf-8");

      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              formattedConfig,
              summary: "Configuration formatted successfully",
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  private async analyzeState(args: any) {
    const { statePath } = args;

    try {
      const { stdout } = await execAsync(`terraform show -json "${statePath}"`);
      const state = JSON.parse(stdout);

      const analysis = {
        resourceCount: state.values?.root_module?.resources?.length || 0,
        providers: [...new Set(state.values?.root_module?.resources?.map((r: any) => r.provider_name) || [])],
        resourceTypes: [...new Set(state.values?.root_module?.resources?.map((r: any) => r.type) || [])],
        modules: state.values?.root_module?.child_modules?.length || 0,
        terraformVersion: state.terraform_version,
        summary: "State analysis completed",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async securityScan(args: any) {
    const { config } = args;

    // Basic security checks (in production, use tools like tfsec, checkov)
    const securityIssues: Array<{severity: string; type: string; message: string}> = [];

    // Check for hardcoded secrets
    if (config.match(/password\s*=\s*["'][^"']*["']/i)) {
      securityIssues.push({
        severity: "HIGH",
        type: "hardcoded_password",
        message: "Hardcoded password detected",
      });
    }

    // Check for insecure protocols
    if (config.includes("http://")) {
      securityIssues.push({
        severity: "MEDIUM",
        type: "insecure_protocol",
        message: "HTTP protocol detected, consider using HTTPS",
      });
    }

    // Check for wildcard CIDR blocks
    if (config.includes("0.0.0.0/0")) {
      securityIssues.push({
        severity: "HIGH",
        type: "open_security_group",
        message: "Security group allows access from anywhere (0.0.0.0/0)",
      });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            issues: securityIssues,
            issueCount: securityIssues.length,
            summary: securityIssues.length === 0 ? "No security issues found" : `Found ${securityIssues.length} security issues`,
          }, null, 2),
        },
      ],
      isError: securityIssues.some(issue => issue.severity === "HIGH"),
    };
  }

  private async costEstimate(args: any) {
    const { config, provider } = args;

    // Basic cost estimation logic (in production, integrate with cloud pricing APIs)
    const resources = config.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g) || [];
    
    const estimates = resources.map(resource => {
      const [, type, name] = resource.match(/resource\s+"([^"]+)"\s+"([^"]+)"/) || [];
      return {
        resource: `${type}.${name}`,
        estimatedMonthlyCost: this.getResourceCostEstimate(type, provider),
        currency: "USD",
      };
    });

    const totalEstimate = estimates.reduce((sum, est) => sum + est.estimatedMonthlyCost, 0);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            provider,
            estimates,
            totalMonthlyCost: totalEstimate,
            currency: "USD",
            disclaimer: "This is a rough estimate. Actual costs may vary based on usage patterns and configurations.",
            summary: `Estimated monthly cost: $${totalEstimate.toFixed(2)}`,
          }, null, 2),
        },
      ],
    };
  }

  private getResourceCostEstimate(resourceType: string, provider: string): number {
    // Simplified cost estimation (replace with actual pricing data)
    const costMap: Record<string, Record<string, number>> = {
      aws: {
        "aws_instance": 50,
        "aws_rds_instance": 100,
        "aws_s3_bucket": 5,
        "aws_vpc": 0,
        "aws_security_group": 0,
      },
      azure: {
        "azurerm_virtual_machine": 45,
        "azurerm_sql_database": 90,
        "azurerm_storage_account": 8,
        "azurerm_resource_group": 0,
      },
      gcp: {
        "google_compute_instance": 40,
        "google_sql_database_instance": 85,
        "google_storage_bucket": 6,
        "google_project": 0,
      },
    };

    return costMap[provider]?.[resourceType] || 10; // Default estimate
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Terraform MCP Server running on stdio");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TerraformMCPServer();
  server.run().catch(console.error);
}

export default TerraformMCPServer; 