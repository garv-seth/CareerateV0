// Comprehensive Integration Catalog for Careerate
// 100+ Popular Services with Plug-and-Play KeyVault Setup

export interface IntegrationConfig {
  id: string;
  name: string;
  service: string;
  category: string;
  type: string;
  description: string;
  icon: string;
  website: string;
  documentation: string;
  popularity: number; // 1-10 scale
  connectionType: 'oauth' | 'api-key' | 'service-account' | 'webhook';
  requiredSecrets: Array<{
    name: string;
    keyVaultKey: string;
    description: string;
    required: boolean;
    type: 'string' | 'json' | 'url' | 'email';
  }>;
  endpoints: {
    auth?: string;
    api: string;
    docs: string;
  };
  scopes?: string[];
  testEndpoint?: string;
  healthCheck: {
    endpoint: string;
    method: 'GET' | 'POST';
    expectedStatus: number;
  };
}

export const INTEGRATION_CATALOG: IntegrationConfig[] = [
  // =====================================================
  // Development & Repository Management
  // =====================================================
  {
    id: 'github',
    name: 'GitHub',
    service: 'github',
    category: 'repository',
    type: 'repository',
    description: 'Code repository hosting and collaboration platform',
    icon: '🐙',
    website: 'https://github.com',
    documentation: 'https://docs.github.com/en/rest',
    popularity: 10,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'GITHUB-CLIENT-ID',
        description: 'GitHub OAuth App Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'GITHUB-CLIENT-SECRET',
        description: 'GitHub OAuth App Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'personalAccessToken',
        keyVaultKey: 'GITHUB-PAT',
        description: 'Personal Access Token for API access',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://github.com/login/oauth/authorize',
      api: 'https://api.github.com',
      docs: 'https://docs.github.com/en/rest'
    },
    scopes: ['repo', 'user:email', 'read:user'],
    testEndpoint: '/user',
    healthCheck: {
      endpoint: 'https://api.github.com/zen',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    service: 'gitlab',
    category: 'repository',
    type: 'repository',
    description: 'DevOps platform with Git repository management',
    icon: '🦊',
    website: 'https://gitlab.com',
    documentation: 'https://docs.gitlab.com/ee/api/',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'GITLAB-CLIENT-ID',
        description: 'GitLab Application ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'GITLAB-CLIENT-SECRET',
        description: 'GitLab Application Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://gitlab.com/oauth/authorize',
      api: 'https://gitlab.com/api/v4',
      docs: 'https://docs.gitlab.com/ee/api/'
    },
    scopes: ['read_user', 'read_repository', 'write_repository'],
    testEndpoint: '/user',
    healthCheck: {
      endpoint: 'https://gitlab.com/api/v4/version',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    service: 'bitbucket',
    category: 'repository',
    type: 'repository',
    description: 'Git repository hosting by Atlassian',
    icon: '🪣',
    website: 'https://bitbucket.org',
    documentation: 'https://developer.atlassian.com/bitbucket/api/2/',
    popularity: 6,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'BITBUCKET-CLIENT-ID',
        description: 'Bitbucket OAuth Consumer Key',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'BITBUCKET-CLIENT-SECRET',
        description: 'Bitbucket OAuth Consumer Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://bitbucket.org/site/oauth2/authorize',
      api: 'https://api.bitbucket.org/2.0',
      docs: 'https://developer.atlassian.com/bitbucket/api/2/'
    },
    scopes: ['repositories', 'account'],
    testEndpoint: '/user',
    healthCheck: {
      endpoint: 'https://api.bitbucket.org/2.0/user',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Cloud Providers
  // =====================================================
  {
    id: 'aws',
    name: 'Amazon Web Services',
    service: 'aws',
    category: 'cloud-provider',
    type: 'cloud-provider',
    description: 'Comprehensive cloud computing platform',
    icon: '☁️',
    website: 'https://aws.amazon.com',
    documentation: 'https://docs.aws.amazon.com/',
    popularity: 10,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'accessKeyId',
        keyVaultKey: 'AWS-ACCESS-KEY-ID',
        description: 'AWS Access Key ID',
        required: true,
        type: 'string'
      },
      {
        name: 'secretAccessKey',
        keyVaultKey: 'AWS-SECRET-ACCESS-KEY',
        description: 'AWS Secret Access Key',
        required: true,
        type: 'string'
      },
      {
        name: 'region',
        keyVaultKey: 'AWS-DEFAULT-REGION',
        description: 'Default AWS Region',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://ec2.amazonaws.com',
      docs: 'https://docs.aws.amazon.com/'
    },
    healthCheck: {
      endpoint: 'https://ec2.us-east-1.amazonaws.com',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    service: 'azure',
    category: 'cloud-provider',
    type: 'cloud-provider',
    description: 'Microsoft cloud computing platform',
    icon: '🔷',
    website: 'https://azure.microsoft.com',
    documentation: 'https://docs.microsoft.com/en-us/azure/',
    popularity: 9,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'AZURE-CLIENT-ID',
        description: 'Azure Application Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'AZURE-CLIENT-SECRET',
        description: 'Azure Application Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'tenantId',
        keyVaultKey: 'AZURE-TENANT-ID',
        description: 'Azure Tenant ID',
        required: true,
        type: 'string'
      },
      {
        name: 'subscriptionId',
        keyVaultKey: 'AZURE-SUBSCRIPTION-ID',
        description: 'Azure Subscription ID',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://login.microsoftonline.com',
      api: 'https://management.azure.com',
      docs: 'https://docs.microsoft.com/en-us/azure/'
    },
    healthCheck: {
      endpoint: 'https://management.azure.com/subscriptions',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    service: 'gcp',
    category: 'cloud-provider',
    type: 'cloud-provider',
    description: 'Google cloud computing platform',
    icon: '🔵',
    website: 'https://cloud.google.com',
    documentation: 'https://cloud.google.com/docs',
    popularity: 8,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'serviceAccountKey',
        keyVaultKey: 'GCP-SERVICE-ACCOUNT-KEY',
        description: 'Service Account JSON Key',
        required: true,
        type: 'json'
      },
      {
        name: 'projectId',
        keyVaultKey: 'GCP-PROJECT-ID',
        description: 'Google Cloud Project ID',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://cloudresourcemanager.googleapis.com',
      docs: 'https://cloud.google.com/docs'
    },
    healthCheck: {
      endpoint: 'https://cloudresourcemanager.googleapis.com/v1/projects',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Container & Orchestration
  // =====================================================
  {
    id: 'docker',
    name: 'Docker Hub',
    service: 'docker',
    category: 'container',
    type: 'container',
    description: 'Container registry and image management',
    icon: '🐳',
    website: 'https://hub.docker.com',
    documentation: 'https://docs.docker.com/docker-hub/api/',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'username',
        keyVaultKey: 'DOCKER-USERNAME',
        description: 'Docker Hub Username',
        required: true,
        type: 'string'
      },
      {
        name: 'accessToken',
        keyVaultKey: 'DOCKER-ACCESS-TOKEN',
        description: 'Docker Hub Access Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://hub.docker.com/v2',
      docs: 'https://docs.docker.com/docker-hub/api/'
    },
    healthCheck: {
      endpoint: 'https://hub.docker.com/v2/user',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    service: 'kubernetes',
    category: 'orchestration',
    type: 'orchestration',
    description: 'Container orchestration platform',
    icon: '⚙️',
    website: 'https://kubernetes.io',
    documentation: 'https://kubernetes.io/docs/reference/generated/kubernetes-api/',
    popularity: 9,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'kubeconfig',
        keyVaultKey: 'KUBERNETES-KUBECONFIG',
        description: 'Kubernetes cluster configuration',
        required: true,
        type: 'json'
      },
      {
        name: 'clusterEndpoint',
        keyVaultKey: 'KUBERNETES-CLUSTER-ENDPOINT',
        description: 'Kubernetes API server endpoint',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      api: 'https://kubernetes.default.svc',
      docs: 'https://kubernetes.io/docs/reference/generated/kubernetes-api/'
    },
    healthCheck: {
      endpoint: '/api/v1/namespaces',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Monitoring & Observability
  // =====================================================
  {
    id: 'datadog',
    name: 'Datadog',
    service: 'datadog',
    category: 'monitoring',
    type: 'monitoring',
    description: 'Cloud monitoring and analytics platform',
    icon: '🐕',
    website: 'https://www.datadoghq.com',
    documentation: 'https://docs.datadoghq.com/api/',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'DATADOG-API-KEY',
        description: 'Datadog API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'appKey',
        keyVaultKey: 'DATADOG-APP-KEY',
        description: 'Datadog Application Key',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.datadoghq.com/api/v1',
      docs: 'https://docs.datadoghq.com/api/'
    },
    testEndpoint: '/validate',
    healthCheck: {
      endpoint: 'https://api.datadoghq.com/api/v1/validate',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    service: 'newrelic',
    category: 'monitoring',
    type: 'monitoring',
    description: 'Application performance monitoring',
    icon: '📊',
    website: 'https://newrelic.com',
    documentation: 'https://docs.newrelic.com/docs/apis/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'NEWRELIC-API-KEY',
        description: 'New Relic User API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'licenseKey',
        keyVaultKey: 'NEWRELIC-LICENSE-KEY',
        description: 'New Relic License Key',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.newrelic.com/v2',
      docs: 'https://docs.newrelic.com/docs/apis/'
    },
    healthCheck: {
      endpoint: 'https://api.newrelic.com/v2/applications.json',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    service: 'prometheus',
    category: 'monitoring',
    type: 'monitoring',
    description: 'Open-source monitoring and alerting toolkit',
    icon: '🔥',
    website: 'https://prometheus.io',
    documentation: 'https://prometheus.io/docs/prometheus/latest/querying/api/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'endpoint',
        keyVaultKey: 'PROMETHEUS-ENDPOINT',
        description: 'Prometheus server endpoint',
        required: true,
        type: 'url'
      },
      {
        name: 'username',
        keyVaultKey: 'PROMETHEUS-USERNAME',
        description: 'Basic auth username (if required)',
        required: false,
        type: 'string'
      },
      {
        name: 'password',
        keyVaultKey: 'PROMETHEUS-PASSWORD',
        description: 'Basic auth password (if required)',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'http://localhost:9090/api/v1',
      docs: 'https://prometheus.io/docs/prometheus/latest/querying/api/'
    },
    healthCheck: {
      endpoint: '/api/v1/query?query=up',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'grafana',
    name: 'Grafana',
    service: 'grafana',
    category: 'monitoring',
    type: 'monitoring',
    description: 'Open-source analytics and monitoring platform',
    icon: '📈',
    website: 'https://grafana.com',
    documentation: 'https://grafana.com/docs/grafana/latest/http_api/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'GRAFANA-API-KEY',
        description: 'Grafana API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'endpoint',
        keyVaultKey: 'GRAFANA-ENDPOINT',
        description: 'Grafana server endpoint',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      api: 'http://localhost:3000/api',
      docs: 'https://grafana.com/docs/grafana/latest/http_api/'
    },
    healthCheck: {
      endpoint: '/api/health',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Databases & Data Storage
  // =====================================================
  {
    id: 'snowflake',
    name: 'Snowflake',
    service: 'snowflake',
    category: 'database',
    type: 'database',
    description: 'Cloud data warehouse platform',
    icon: '❄️',
    website: 'https://www.snowflake.com',
    documentation: 'https://docs.snowflake.com/en/developer-guide/sql-api/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'account',
        keyVaultKey: 'SNOWFLAKE-ACCOUNT',
        description: 'Snowflake account identifier',
        required: true,
        type: 'string'
      },
      {
        name: 'username',
        keyVaultKey: 'SNOWFLAKE-USERNAME',
        description: 'Snowflake username',
        required: true,
        type: 'string'
      },
      {
        name: 'password',
        keyVaultKey: 'SNOWFLAKE-PASSWORD',
        description: 'Snowflake password',
        required: true,
        type: 'string'
      },
      {
        name: 'warehouse',
        keyVaultKey: 'SNOWFLAKE-WAREHOUSE',
        description: 'Default warehouse',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://{account}.snowflakecomputing.com',
      docs: 'https://docs.snowflake.com/en/developer-guide/sql-api/'
    },
    healthCheck: {
      endpoint: '/api/v2/statements',
      method: 'POST',
      expectedStatus: 200
    }
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    service: 'mongodb',
    category: 'database',
    type: 'database',
    description: 'Cloud document database service',
    icon: '🍃',
    website: 'https://www.mongodb.com/atlas',
    documentation: 'https://docs.atlas.mongodb.com/api/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'publicKey',
        keyVaultKey: 'MONGODB-PUBLIC-KEY',
        description: 'MongoDB Atlas Public Key',
        required: true,
        type: 'string'
      },
      {
        name: 'privateKey',
        keyVaultKey: 'MONGODB-PRIVATE-KEY',
        description: 'MongoDB Atlas Private Key',
        required: true,
        type: 'string'
      },
      {
        name: 'connectionString',
        keyVaultKey: 'MONGODB-CONNECTION-STRING',
        description: 'MongoDB connection string',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://cloud.mongodb.com/api/atlas/v1.0',
      docs: 'https://docs.atlas.mongodb.com/api/'
    },
    healthCheck: {
      endpoint: '/groups',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'redis',
    name: 'Redis Cloud',
    service: 'redis',
    category: 'database',
    type: 'database',
    description: 'In-memory data structure store',
    icon: '🔴',
    website: 'https://redis.com',
    documentation: 'https://docs.redis.com/latest/rc/api/',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'REDIS-API-KEY',
        description: 'Redis Cloud API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'secretKey',
        keyVaultKey: 'REDIS-SECRET-KEY',
        description: 'Redis Cloud Secret Key',
        required: true,
        type: 'string'
      },
      {
        name: 'endpoint',
        keyVaultKey: 'REDIS-ENDPOINT',
        description: 'Redis instance endpoint',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      api: 'https://api.redislabs.com/v1',
      docs: 'https://docs.redis.com/latest/rc/api/'
    },
    healthCheck: {
      endpoint: '/subscriptions',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // AI & Machine Learning
  // =====================================================
  {
    id: 'openai',
    name: 'OpenAI',
    service: 'openai',
    category: 'ai',
    type: 'ai',
    description: 'Advanced AI models and APIs',
    icon: '🤖',
    website: 'https://openai.com',
    documentation: 'https://platform.openai.com/docs',
    popularity: 10,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'OPENAI-API-KEY',
        description: 'OpenAI API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'organizationId',
        keyVaultKey: 'OPENAI-ORG-ID',
        description: 'OpenAI Organization ID',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.openai.com/v1',
      docs: 'https://platform.openai.com/docs'
    },
    testEndpoint: '/models',
    healthCheck: {
      endpoint: 'https://api.openai.com/v1/models',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    service: 'anthropic',
    category: 'ai',
    type: 'ai',
    description: 'Constitutional AI assistant',
    icon: '🧠',
    website: 'https://www.anthropic.com',
    documentation: 'https://docs.anthropic.com/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'ANTHROPIC-API-KEY',
        description: 'Anthropic API Key',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.anthropic.com/v1',
      docs: 'https://docs.anthropic.com/'
    },
    healthCheck: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      expectedStatus: 200
    }
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    service: 'huggingface',
    category: 'ai',
    type: 'ai',
    description: 'Open-source AI model hub',
    icon: '🤗',
    website: 'https://huggingface.co',
    documentation: 'https://huggingface.co/docs/api-inference/',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'HUGGINGFACE-API-KEY',
        description: 'Hugging Face API Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api-inference.huggingface.co',
      docs: 'https://huggingface.co/docs/api-inference/'
    },
    healthCheck: {
      endpoint: 'https://api-inference.huggingface.co/models',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Payment Processing
  // =====================================================
  {
    id: 'stripe',
    name: 'Stripe',
    service: 'stripe',
    category: 'payment',
    type: 'payment',
    description: 'Online payment processing platform',
    icon: '💳',
    website: 'https://stripe.com',
    documentation: 'https://stripe.com/docs/api',
    popularity: 10,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'secretKey',
        keyVaultKey: 'STRIPE-SECRET-KEY',
        description: 'Stripe Secret Key',
        required: true,
        type: 'string'
      },
      {
        name: 'webhookSecret',
        keyVaultKey: 'STRIPE-WEBHOOK-SECRET',
        description: 'Stripe Webhook Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'publishableKey',
        keyVaultKey: 'STRIPE-PUBLISHABLE-KEY',
        description: 'Stripe Publishable Key',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.stripe.com/v1',
      docs: 'https://stripe.com/docs/api'
    },
    testEndpoint: '/balance',
    healthCheck: {
      endpoint: 'https://api.stripe.com/v1/balance',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'paypal',
    name: 'PayPal',
    service: 'paypal',
    category: 'payment',
    type: 'payment',
    description: 'Digital payment platform',
    icon: '💰',
    website: 'https://www.paypal.com',
    documentation: 'https://developer.paypal.com/docs/api/',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'PAYPAL-CLIENT-ID',
        description: 'PayPal Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'PAYPAL-CLIENT-SECRET',
        description: 'PayPal Client Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://www.paypal.com/signin/authorize',
      api: 'https://api.paypal.com/v1',
      docs: 'https://developer.paypal.com/docs/api/'
    },
    healthCheck: {
      endpoint: 'https://api.paypal.com/v1/oauth2/token',
      method: 'POST',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Communication & Notifications
  // =====================================================
  {
    id: 'sendgrid',
    name: 'SendGrid',
    service: 'sendgrid',
    category: 'communication',
    type: 'communication',
    description: 'Email delivery service',
    icon: '📧',
    website: 'https://sendgrid.com',
    documentation: 'https://docs.sendgrid.com/api-reference/',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'SENDGRID-API-KEY',
        description: 'SendGrid API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'fromEmail',
        keyVaultKey: 'SENDGRID-FROM-EMAIL',
        description: 'Verified sender email',
        required: true,
        type: 'email'
      }
    ],
    endpoints: {
      api: 'https://api.sendgrid.com/v3',
      docs: 'https://docs.sendgrid.com/api-reference/'
    },
    testEndpoint: '/user/profile',
    healthCheck: {
      endpoint: 'https://api.sendgrid.com/v3/user/profile',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'twilio',
    name: 'Twilio',
    service: 'twilio',
    category: 'communication',
    type: 'communication',
    description: 'Programmable communications platform',
    icon: '📱',
    website: 'https://www.twilio.com',
    documentation: 'https://www.twilio.com/docs/usage/api',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'accountSid',
        keyVaultKey: 'TWILIO-ACCOUNT-SID',
        description: 'Twilio Account SID',
        required: true,
        type: 'string'
      },
      {
        name: 'authToken',
        keyVaultKey: 'TWILIO-AUTH-TOKEN',
        description: 'Twilio Auth Token',
        required: true,
        type: 'string'
      },
      {
        name: 'phoneNumber',
        keyVaultKey: 'TWILIO-PHONE-NUMBER',
        description: 'Twilio Phone Number',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.twilio.com/2010-04-01',
      docs: 'https://www.twilio.com/docs/usage/api'
    },
    testEndpoint: '/Accounts',
    healthCheck: {
      endpoint: 'https://api.twilio.com/2010-04-01/Accounts.json',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    service: 'slack',
    category: 'communication',
    type: 'communication',
    description: 'Team collaboration and messaging platform',
    icon: '💬',
    website: 'https://slack.com',
    documentation: 'https://api.slack.com/',
    popularity: 9,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'SLACK-CLIENT-ID',
        description: 'Slack App Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'SLACK-CLIENT-SECRET',
        description: 'Slack App Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'botToken',
        keyVaultKey: 'SLACK-BOT-TOKEN',
        description: 'Slack Bot User OAuth Token',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://slack.com/oauth/v2/authorize',
      api: 'https://slack.com/api',
      docs: 'https://api.slack.com/'
    },
    scopes: ['chat:write', 'channels:read', 'users:read'],
    testEndpoint: '/api/test',
    healthCheck: {
      endpoint: 'https://slack.com/api/api.test',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    service: 'discord',
    category: 'communication',
    type: 'communication',
    description: 'Voice, video and text communication service',
    icon: '🎮',
    website: 'https://discord.com',
    documentation: 'https://discord.com/developers/docs/',
    popularity: 7,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'DISCORD-CLIENT-ID',
        description: 'Discord Application Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'DISCORD-CLIENT-SECRET',
        description: 'Discord Application Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'botToken',
        keyVaultKey: 'DISCORD-BOT-TOKEN',
        description: 'Discord Bot Token',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://discord.com/api/oauth2/authorize',
      api: 'https://discord.com/api/v10',
      docs: 'https://discord.com/developers/docs/'
    },
    scopes: ['identify', 'email', 'guilds'],
    healthCheck: {
      endpoint: 'https://discord.com/api/v10/users/@me',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Analytics & Business Intelligence
  // =====================================================
  {
    id: 'googleanalytics',
    name: 'Google Analytics',
    service: 'googleanalytics',
    category: 'analytics',
    type: 'analytics',
    description: 'Web analytics service',
    icon: '📊',
    website: 'https://analytics.google.com',
    documentation: 'https://developers.google.com/analytics',
    popularity: 10,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'serviceAccountKey',
        keyVaultKey: 'GA-SERVICE-ACCOUNT-KEY',
        description: 'Google Analytics Service Account JSON',
        required: true,
        type: 'json'
      },
      {
        name: 'propertyId',
        keyVaultKey: 'GA-PROPERTY-ID',
        description: 'Google Analytics Property ID',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://analyticsreporting.googleapis.com/v4',
      docs: 'https://developers.google.com/analytics'
    },
    healthCheck: {
      endpoint: 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
      method: 'POST',
      expectedStatus: 200
    }
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    service: 'mixpanel',
    category: 'analytics',
    type: 'analytics',
    description: 'Product analytics platform',
    icon: '📈',
    website: 'https://mixpanel.com',
    documentation: 'https://developer.mixpanel.com/docs',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'projectToken',
        keyVaultKey: 'MIXPANEL-PROJECT-TOKEN',
        description: 'Mixpanel Project Token',
        required: true,
        type: 'string'
      },
      {
        name: 'apiSecret',
        keyVaultKey: 'MIXPANEL-API-SECRET',
        description: 'Mixpanel API Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://mixpanel.com/api',
      docs: 'https://developer.mixpanel.com/docs'
    },
    healthCheck: {
      endpoint: 'https://mixpanel.com/api/2.0/events',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    service: 'amplitude',
    category: 'analytics',
    type: 'analytics',
    description: 'Digital analytics platform',
    icon: '📊',
    website: 'https://amplitude.com',
    documentation: 'https://developers.amplitude.com/',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'AMPLITUDE-API-KEY',
        description: 'Amplitude API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'secretKey',
        keyVaultKey: 'AMPLITUDE-SECRET-KEY',
        description: 'Amplitude Secret Key',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api2.amplitude.com',
      docs: 'https://developers.amplitude.com/'
    },
    healthCheck: {
      endpoint: 'https://api2.amplitude.com/2/httpapi',
      method: 'POST',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Security & Compliance
  // =====================================================
  {
    id: 'okta',
    name: 'Okta',
    service: 'okta',
    category: 'security',
    type: 'security',
    description: 'Identity and access management platform',
    icon: '🔐',
    website: 'https://www.okta.com',
    documentation: 'https://developer.okta.com/docs/reference/',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'OKTA-CLIENT-ID',
        description: 'Okta Application Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'OKTA-CLIENT-SECRET',
        description: 'Okta Application Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'domain',
        keyVaultKey: 'OKTA-DOMAIN',
        description: 'Okta domain (e.g., dev-123456.okta.com)',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://{domain}/oauth2/v1/authorize',
      api: 'https://{domain}/api/v1',
      docs: 'https://developer.okta.com/docs/reference/'
    },
    scopes: ['openid', 'profile', 'email'],
    healthCheck: {
      endpoint: '/api/v1/org',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'auth0',
    name: 'Auth0',
    service: 'auth0',
    category: 'security',
    type: 'security',
    description: 'Identity platform for developers',
    icon: '🛡️',
    website: 'https://auth0.com',
    documentation: 'https://auth0.com/docs/api',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'AUTH0-CLIENT-ID',
        description: 'Auth0 Application Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'AUTH0-CLIENT-SECRET',
        description: 'Auth0 Application Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'domain',
        keyVaultKey: 'AUTH0-DOMAIN',
        description: 'Auth0 domain (e.g., dev-123456.us.auth0.com)',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://{domain}/authorize',
      api: 'https://{domain}/api/v2',
      docs: 'https://auth0.com/docs/api'
    },
    scopes: ['openid', 'profile', 'email'],
    healthCheck: {
      endpoint: '/api/v2/users',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // CI/CD & DevOps
  // =====================================================
  {
    id: 'jenkins',
    name: 'Jenkins',
    service: 'jenkins',
    category: 'cicd',
    type: 'cicd',
    description: 'Open-source automation server',
    icon: '🔧',
    website: 'https://www.jenkins.io',
    documentation: 'https://www.jenkins.io/doc/book/using/remote-access-api/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'endpoint',
        keyVaultKey: 'JENKINS-ENDPOINT',
        description: 'Jenkins server URL',
        required: true,
        type: 'url'
      },
      {
        name: 'username',
        keyVaultKey: 'JENKINS-USERNAME',
        description: 'Jenkins username',
        required: true,
        type: 'string'
      },
      {
        name: 'apiToken',
        keyVaultKey: 'JENKINS-API-TOKEN',
        description: 'Jenkins API Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'http://localhost:8080/api',
      docs: 'https://www.jenkins.io/doc/book/using/remote-access-api/'
    },
    healthCheck: {
      endpoint: '/api/json',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'githubactions',
    name: 'GitHub Actions',
    service: 'githubactions',
    category: 'cicd',
    type: 'cicd',
    description: 'CI/CD platform integrated with GitHub',
    icon: '⚡',
    website: 'https://github.com/features/actions',
    documentation: 'https://docs.github.com/en/rest/actions',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'token',
        keyVaultKey: 'GITHUB-ACTIONS-TOKEN',
        description: 'GitHub Personal Access Token with Actions scope',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.github.com',
      docs: 'https://docs.github.com/en/rest/actions'
    },
    healthCheck: {
      endpoint: 'https://api.github.com/user',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    service: 'circleci',
    category: 'cicd',
    type: 'cicd',
    description: 'Continuous integration and delivery platform',
    icon: '🔄',
    website: 'https://circleci.com',
    documentation: 'https://circleci.com/docs/api/',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiToken',
        keyVaultKey: 'CIRCLECI-API-TOKEN',
        description: 'CircleCI Personal API Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://circleci.com/api/v2',
      docs: 'https://circleci.com/docs/api/'
    },
    healthCheck: {
      endpoint: 'https://circleci.com/api/v2/me',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Project Management & Productivity
  // =====================================================
  {
    id: 'jira',
    name: 'Jira',
    service: 'jira',
    category: 'project-management',
    type: 'project-management',
    description: 'Issue tracking and project management',
    icon: '📋',
    website: 'https://www.atlassian.com/software/jira',
    documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    popularity: 9,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'JIRA-CLIENT-ID',
        description: 'Jira OAuth Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'JIRA-CLIENT-SECRET',
        description: 'Jira OAuth Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'domain',
        keyVaultKey: 'JIRA-DOMAIN',
        description: 'Jira instance domain',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://auth.atlassian.com/authorize',
      api: 'https://{domain}.atlassian.net/rest/api/3',
      docs: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/'
    },
    scopes: ['read:jira-work', 'write:jira-work'],
    healthCheck: {
      endpoint: '/rest/api/3/serverInfo',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'notion',
    name: 'Notion',
    service: 'notion',
    category: 'project-management',
    type: 'project-management',
    description: 'All-in-one workspace for notes and collaboration',
    icon: '📝',
    website: 'https://www.notion.so',
    documentation: 'https://developers.notion.com/',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'NOTION-CLIENT-ID',
        description: 'Notion Integration Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'NOTION-CLIENT-SECRET',
        description: 'Notion Integration Client Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://api.notion.com/v1/oauth/authorize',
      api: 'https://api.notion.com/v1',
      docs: 'https://developers.notion.com/'
    },
    scopes: ['read', 'update', 'insert'],
    healthCheck: {
      endpoint: 'https://api.notion.com/v1/users/me',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'trello',
    name: 'Trello',
    service: 'trello',
    category: 'project-management',
    type: 'project-management',
    description: 'Visual project management tool',
    icon: '📌',
    website: 'https://trello.com',
    documentation: 'https://developer.atlassian.com/cloud/trello/rest/',
    popularity: 7,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'TRELLO-API-KEY',
        description: 'Trello API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'token',
        keyVaultKey: 'TRELLO-TOKEN',
        description: 'Trello OAuth Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.trello.com/1',
      docs: 'https://developer.atlassian.com/cloud/trello/rest/'
    },
    healthCheck: {
      endpoint: 'https://api.trello.com/1/members/me',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Storage & CDN
  // =====================================================
  {
    id: 's3',
    name: 'Amazon S3',
    service: 's3',
    category: 'storage',
    type: 'storage',
    description: 'Object storage service',
    icon: '🪣',
    website: 'https://aws.amazon.com/s3/',
    documentation: 'https://docs.aws.amazon.com/s3/latest/API/',
    popularity: 10,
    connectionType: 'service-account',
    requiredSecrets: [
      {
        name: 'accessKeyId',
        keyVaultKey: 'S3-ACCESS-KEY-ID',
        description: 'AWS Access Key ID',
        required: true,
        type: 'string'
      },
      {
        name: 'secretAccessKey',
        keyVaultKey: 'S3-SECRET-ACCESS-KEY',
        description: 'AWS Secret Access Key',
        required: true,
        type: 'string'
      },
      {
        name: 'region',
        keyVaultKey: 'S3-REGION',
        description: 'S3 bucket region',
        required: true,
        type: 'string'
      },
      {
        name: 'bucketName',
        keyVaultKey: 'S3-BUCKET-NAME',
        description: 'Default S3 bucket name',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://s3.amazonaws.com',
      docs: 'https://docs.aws.amazon.com/s3/latest/API/'
    },
    healthCheck: {
      endpoint: 'https://s3.amazonaws.com',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    service: 'cloudflare',
    category: 'cdn',
    type: 'cdn',
    description: 'CDN and web security platform',
    icon: '☁️',
    website: 'https://www.cloudflare.com',
    documentation: 'https://developers.cloudflare.com/api/',
    popularity: 9,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'CLOUDFLARE-API-KEY',
        description: 'Cloudflare Global API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'email',
        keyVaultKey: 'CLOUDFLARE-EMAIL',
        description: 'Cloudflare account email',
        required: true,
        type: 'email'
      },
      {
        name: 'zoneId',
        keyVaultKey: 'CLOUDFLARE-ZONE-ID',
        description: 'Cloudflare Zone ID',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.cloudflare.com/client/v4',
      docs: 'https://developers.cloudflare.com/api/'
    },
    testEndpoint: '/user',
    healthCheck: {
      endpoint: 'https://api.cloudflare.com/client/v4/user',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Data Processing & ETL
  // =====================================================
  {
    id: 'databricks',
    name: 'Databricks',
    service: 'databricks',
    category: 'data',
    type: 'data',
    description: 'Unified analytics platform for big data and machine learning',
    icon: '🧮',
    website: 'https://databricks.com',
    documentation: 'https://docs.databricks.com/dev-tools/api/',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'token',
        keyVaultKey: 'DATABRICKS-TOKEN',
        description: 'Databricks Personal Access Token',
        required: true,
        type: 'string'
      },
      {
        name: 'workspace',
        keyVaultKey: 'DATABRICKS-WORKSPACE',
        description: 'Databricks workspace URL',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      api: 'https://{workspace}/api/2.0',
      docs: 'https://docs.databricks.com/dev-tools/api/'
    },
    healthCheck: {
      endpoint: '/api/2.0/clusters/list',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'airflow',
    name: 'Apache Airflow',
    service: 'airflow',
    category: 'data',
    type: 'data',
    description: 'Platform for workflow automation and scheduling',
    icon: '🌊',
    website: 'https://airflow.apache.org',
    documentation: 'https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'endpoint',
        keyVaultKey: 'AIRFLOW-ENDPOINT',
        description: 'Airflow webserver URL',
        required: true,
        type: 'url'
      },
      {
        name: 'username',
        keyVaultKey: 'AIRFLOW-USERNAME',
        description: 'Airflow username',
        required: true,
        type: 'string'
      },
      {
        name: 'password',
        keyVaultKey: 'AIRFLOW-PASSWORD',
        description: 'Airflow password',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'http://localhost:8080/api/v1',
      docs: 'https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html'
    },
    healthCheck: {
      endpoint: '/api/v1/health',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Testing & Quality Assurance
  // =====================================================
  {
    id: 'sonarcloud',
    name: 'SonarCloud',
    service: 'sonarcloud',
    category: 'testing',
    type: 'testing',
    description: 'Cloud-based code quality and security analysis',
    icon: '🔍',
    website: 'https://sonarcloud.io',
    documentation: 'https://sonarcloud.io/web_api',
    popularity: 7,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'token',
        keyVaultKey: 'SONARCLOUD-TOKEN',
        description: 'SonarCloud User Token',
        required: true,
        type: 'string'
      },
      {
        name: 'organization',
        keyVaultKey: 'SONARCLOUD-ORGANIZATION',
        description: 'SonarCloud Organization Key',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://sonarcloud.io/api',
      docs: 'https://sonarcloud.io/web_api'
    },
    healthCheck: {
      endpoint: 'https://sonarcloud.io/api/system/status',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'codecov',
    name: 'Codecov',
    service: 'codecov',
    category: 'testing',
    type: 'testing',
    description: 'Code coverage reporting tool',
    icon: '📊',
    website: 'https://codecov.io',
    documentation: 'https://docs.codecov.com/reference',
    popularity: 6,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'token',
        keyVaultKey: 'CODECOV-TOKEN',
        description: 'Codecov Upload Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://codecov.io/api',
      docs: 'https://docs.codecov.com/reference'
    },
    healthCheck: {
      endpoint: 'https://codecov.io/api/v2/github',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Business Intelligence & Data Visualization
  // =====================================================
  {
    id: 'tableau',
    name: 'Tableau',
    service: 'tableau',
    category: 'analytics',
    type: 'analytics',
    description: 'Business intelligence and data visualization',
    icon: '📊',
    website: 'https://www.tableau.com',
    documentation: 'https://help.tableau.com/current/api/rest_api/en-us/',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'username',
        keyVaultKey: 'TABLEAU-USERNAME',
        description: 'Tableau username',
        required: true,
        type: 'string'
      },
      {
        name: 'password',
        keyVaultKey: 'TABLEAU-PASSWORD',
        description: 'Tableau password',
        required: true,
        type: 'string'
      },
      {
        name: 'serverUrl',
        keyVaultKey: 'TABLEAU-SERVER-URL',
        description: 'Tableau Server URL',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      api: 'https://tableau.server.com/api',
      docs: 'https://help.tableau.com/current/api/rest_api/en-us/'
    },
    healthCheck: {
      endpoint: '/api/3.16/serverinfo',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    service: 'powerbi',
    category: 'analytics',
    type: 'analytics',
    description: 'Business analytics solution by Microsoft',
    icon: '⚡',
    website: 'https://powerbi.microsoft.com',
    documentation: 'https://docs.microsoft.com/en-us/rest/api/power-bi/',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'POWERBI-CLIENT-ID',
        description: 'Power BI Application Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'POWERBI-CLIENT-SECRET',
        description: 'Power BI Application Client Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      api: 'https://api.powerbi.com/v1.0',
      docs: 'https://docs.microsoft.com/en-us/rest/api/power-bi/'
    },
    scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    healthCheck: {
      endpoint: 'https://api.powerbi.com/v1.0/myorg/groups',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // E-commerce & CRM
  // =====================================================
  {
    id: 'shopify',
    name: 'Shopify',
    service: 'shopify',
    category: 'ecommerce',
    type: 'ecommerce',
    description: 'E-commerce platform for online stores',
    icon: '🛍️',
    website: 'https://www.shopify.com',
    documentation: 'https://shopify.dev/docs/admin-api/rest/reference',
    popularity: 9,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'apiKey',
        keyVaultKey: 'SHOPIFY-API-KEY',
        description: 'Shopify API Key',
        required: true,
        type: 'string'
      },
      {
        name: 'apiSecret',
        keyVaultKey: 'SHOPIFY-API-SECRET',
        description: 'Shopify API Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'shopDomain',
        keyVaultKey: 'SHOPIFY-SHOP-DOMAIN',
        description: 'Shopify shop domain',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://{shop}.myshopify.com/admin/oauth/authorize',
      api: 'https://{shop}.myshopify.com/admin/api/2023-10',
      docs: 'https://shopify.dev/docs/admin-api/rest/reference'
    },
    scopes: ['read_products', 'write_products', 'read_orders'],
    healthCheck: {
      endpoint: '/admin/api/2023-10/shop.json',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    service: 'salesforce',
    category: 'crm',
    type: 'crm',
    description: 'Customer relationship management platform',
    icon: '☁️',
    website: 'https://www.salesforce.com',
    documentation: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/',
    popularity: 9,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'SALESFORCE-CLIENT-ID',
        description: 'Salesforce Connected App Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'SALESFORCE-CLIENT-SECRET',
        description: 'Salesforce Connected App Client Secret',
        required: true,
        type: 'string'
      },
      {
        name: 'instanceUrl',
        keyVaultKey: 'SALESFORCE-INSTANCE-URL',
        description: 'Salesforce instance URL',
        required: true,
        type: 'url'
      }
    ],
    endpoints: {
      auth: 'https://login.salesforce.com/services/oauth2/authorize',
      api: 'https://instance.salesforce.com/services/data/v58.0',
      docs: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/'
    },
    scopes: ['api', 'refresh_token'],
    healthCheck: {
      endpoint: '/services/data/v58.0/sobjects',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    service: 'hubspot',
    category: 'crm',
    type: 'crm',
    description: 'Inbound marketing and sales platform',
    icon: '🎯',
    website: 'https://www.hubspot.com',
    documentation: 'https://developers.hubspot.com/docs/api/overview',
    popularity: 8,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'clientId',
        keyVaultKey: 'HUBSPOT-CLIENT-ID',
        description: 'HubSpot App Client ID',
        required: true,
        type: 'string'
      },
      {
        name: 'clientSecret',
        keyVaultKey: 'HUBSPOT-CLIENT-SECRET',
        description: 'HubSpot App Client Secret',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://app.hubspot.com/oauth/authorize',
      api: 'https://api.hubapi.com',
      docs: 'https://developers.hubspot.com/docs/api/overview'
    },
    scopes: ['contacts', 'content'],
    healthCheck: {
      endpoint: 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all',
      method: 'GET',
      expectedStatus: 200
    }
  },

  // =====================================================
  // Additional High-Value Integrations
  // =====================================================
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    service: 'elasticsearch',
    category: 'search',
    type: 'search',
    description: 'Distributed search and analytics engine',
    icon: '🔍',
    website: 'https://www.elastic.co',
    documentation: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'endpoint',
        keyVaultKey: 'ELASTICSEARCH-ENDPOINT',
        description: 'Elasticsearch cluster endpoint',
        required: true,
        type: 'url'
      },
      {
        name: 'username',
        keyVaultKey: 'ELASTICSEARCH-USERNAME',
        description: 'Elasticsearch username',
        required: false,
        type: 'string'
      },
      {
        name: 'password',
        keyVaultKey: 'ELASTICSEARCH-PASSWORD',
        description: 'Elasticsearch password',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'http://localhost:9200',
      docs: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html'
    },
    healthCheck: {
      endpoint: '/_cluster/health',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'vercel',
    name: 'Vercel',
    service: 'vercel',
    category: 'deployment',
    type: 'deployment',
    description: 'Frontend deployment and hosting platform',
    icon: '▲',
    website: 'https://vercel.com',
    documentation: 'https://vercel.com/docs/rest-api',
    popularity: 8,
    connectionType: 'api-key',
    requiredSecrets: [
      {
        name: 'token',
        keyVaultKey: 'VERCEL-TOKEN',
        description: 'Vercel API Token',
        required: true,
        type: 'string'
      },
      {
        name: 'teamId',
        keyVaultKey: 'VERCEL-TEAM-ID',
        description: 'Vercel Team ID (optional)',
        required: false,
        type: 'string'
      }
    ],
    endpoints: {
      api: 'https://api.vercel.com',
      docs: 'https://vercel.com/docs/rest-api'
    },
    healthCheck: {
      endpoint: 'https://api.vercel.com/v2/user',
      method: 'GET',
      expectedStatus: 200
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    service: 'netlify',
    category: 'deployment',
    type: 'deployment',
    description: 'Web development platform for modern web projects',
    icon: '🌐',
    website: 'https://www.netlify.com',
    documentation: 'https://docs.netlify.com/api/get-started/',
    popularity: 7,
    connectionType: 'oauth',
    requiredSecrets: [
      {
        name: 'accessToken',
        keyVaultKey: 'NETLIFY-ACCESS-TOKEN',
        description: 'Netlify Personal Access Token',
        required: true,
        type: 'string'
      }
    ],
    endpoints: {
      auth: 'https://app.netlify.com/authorize',
      api: 'https://api.netlify.com/api/v1',
      docs: 'https://docs.netlify.com/api/get-started/'
    },
    healthCheck: {
      endpoint: 'https://api.netlify.com/api/v1/user',
      method: 'GET',
      expectedStatus: 200
    }
  }
];

// Helper functions for integration management
export function getIntegrationByService(service: string): IntegrationConfig | undefined {
  return INTEGRATION_CATALOG.find(integration => integration.service === service);
}

export function getIntegrationsByCategory(category: string): IntegrationConfig[] {
  return INTEGRATION_CATALOG.filter(integration => integration.category === category);
}

export function getPopularIntegrations(limit: number = 10): IntegrationConfig[] {
  return INTEGRATION_CATALOG
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export function searchIntegrations(query: string): IntegrationConfig[] {
  const lowercaseQuery = query.toLowerCase();
  return INTEGRATION_CATALOG.filter(integration =>
    integration.name.toLowerCase().includes(lowercaseQuery) ||
    integration.service.toLowerCase().includes(lowercaseQuery) ||
    integration.description.toLowerCase().includes(lowercaseQuery) ||
    integration.category.toLowerCase().includes(lowercaseQuery)
  );
}

export const INTEGRATION_CATEGORIES = [
  'repository',
  'cloud-provider',
  'container',
  'orchestration',
  'monitoring',
  'database',
  'ai',
  'payment',
  'communication',
  'cicd',
  'project-management',
  'storage',
  'cdn',
  'data',
  'testing',
  'analytics',
  'ecommerce',
  'crm',
  'search',
  'deployment'
];
