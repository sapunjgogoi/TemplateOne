// baseTemplates.js - Predefined base configurations and merge helper (v2)
const fs = require('fs');
const path = require('path');

const defaultParams = {
  projectName: "aws-cloud-app",
  instanceType: "t2.micro",
  region: "us-east-1",
  containerPort: 5000,
  replicas: 1,
  databaseType: "PostgreSQL",
  dockerImage: "node:18-alpine",
  storageBucket: "app-static-assets-s3-bucket",
  enableCloudFront: false,
  enableDocker: false,
  enableKubernetes: false
};

// AMI Mapping based on AWS Region
const regionAmiMap = {
  "us-east-1": "ami-0c7217cdde317cfec",   // Amazon Linux 2 (us-east-1)
  "us-west-2": "ami-03d5c484a093db274",   // Amazon Linux 2 (us-west-2)
  "ap-south-1": "ami-0851b76e8b1b590d4",  // Amazon Linux 2 (ap-south-1)
  "eu-west-1": "ami-0d527b7c664d488b7"   // Amazon Linux 2 (eu-west-1)
};

// Clean parameters to prevent directory traversal or malicious injection
function sanitizeParam(val, allowSlash = false) {
  if (typeof val !== 'string') return val;
  
  // Remove directory traversal sequences
  let cleaned = val.replace(/\.\./g, '').replace(/\\/g, '');
  
  if (!allowSlash) {
    cleaned = cleaned.replace(/\//g, '');
  }
  
  // Allow only valid characters (alphanumeric, hyphens, underscores, dots, or slashes if allowed)
  if (allowSlash) {
    return cleaned.replace(/[^a-zA-Z0-9_\-\.\/:]/g, '');
  }
  return cleaned.replace(/[^a-zA-Z0-9_\-\.]/g, '');
}

// Read template files from disk
function loadTemplate(filename) {
  try {
    const templatePath = path.join(__dirname, 'v2', filename);
    return fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error(`[ERROR] Failed to load template file: ${filename}`, err);
    throw err;
  }
}

// Replace double curly placeholders
function replacePlaceholders(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    output = output.replace(placeholder, String(value));
  }
  return output;
}

// Generate base blueprints by merging custom parameters
function generateMergedTemplates(params) {
  const mergedParams = { ...defaultParams, ...params };

  // Sanitize all inputs
  const sanitized = {
    projectName: sanitizeParam(mergedParams.projectName, false),
    instanceType: sanitizeParam(mergedParams.instanceType, false),
    region: sanitizeParam(mergedParams.region, false),
    containerPort: Number(mergedParams.containerPort) || 5000,
    replicas: Number(mergedParams.replicas) || 1,
    databaseType: sanitizeParam(mergedParams.databaseType, false),
    dockerImage: sanitizeParam(mergedParams.dockerImage, true),
    storageBucket: sanitizeParam(mergedParams.storageBucket, false),
    enableCloudFront: Boolean(mergedParams.enableCloudFront),
    enableDocker: Boolean(mergedParams.enableDocker),
    enableKubernetes: Boolean(mergedParams.enableKubernetes)
  };

  // Determine AMI ID based on region
  const amiId = regionAmiMap[sanitized.region.toLowerCase()] || "ami-0c7217cdde317cfec";

  // Build the replacements mapping
  const replacements = {
    PROJECT_NAME: sanitized.projectName,
    INSTANCE_TYPE: sanitized.instanceType,
    AMI_ID: amiId,
    STORAGE_BUCKET: sanitized.storageBucket,
    DOCKER_IMAGE: sanitized.dockerImage,
    CONTAINER_PORT: sanitized.containerPort,
    REPLICAS: sanitized.replicas
  };

  // Load and merge static templates
  const terraformTemplate = loadTemplate('terraform.tf.template');
  const dockerComposeTemplate = loadTemplate('docker-compose.yml.template');
  const k8sDeploymentTemplate = loadTemplate('k8s-deployment.yaml.template');
  const k8sServiceTemplate = loadTemplate('k8s-service.yaml.template');
  const cloudFormationTemplate = loadTemplate('cloudformation.yaml.template');

  const terraformCode = replacePlaceholders(terraformTemplate, replacements);
  const dockerComposeCode = replacePlaceholders(dockerComposeTemplate, replacements);
  const k8sDeploymentCode = replacePlaceholders(k8sDeploymentTemplate, replacements);
  const k8sServiceCode = replacePlaceholders(k8sServiceTemplate, replacements);
  const cloudFormationCode = replacePlaceholders(cloudFormationTemplate, replacements);

  const readmeCode = `# Custom AWS Deployment Package for ${sanitized.projectName}

This package contains statically customized deployment configurations.

## Stack Overview
- **Compute (EC2)**: Size \`${sanitized.instanceType}\` in Region \`${sanitized.region}\` (AMI ID: \`${amiId}\`)
- **Database**: Managed \`${sanitized.databaseType}\`
- **Asset Storage**: S3 bucket \`${sanitized.storageBucket}\`
- **Docker Runtimes**: Enabled (\`${sanitized.enableDocker}\`)
- **Kubernetes Orch**: Enabled (\`${sanitized.enableKubernetes}\`)

## Files in Package:
- **terraform.tf**: Main Terraform IaC definition
- **cloudformation.yaml**: CloudFormation Stack configuration
- **docker-compose.yml**: local container setups (if enabled)
- **k8s-deployment.yaml** / **k8s-service.yaml**: Kubernetes orchestrations (if enabled)
`;

  // Filter returned files based on what features are requested
  const files = {
    "terraform.tf": terraformCode,
    "cloudformation.yaml": cloudFormationCode,
    "README.md": readmeCode
  };

  if (sanitized.enableDocker) {
    files["docker-compose.yml"] = dockerComposeCode;
  }
  if (sanitized.enableKubernetes) {
    files["k8s-deployment.yaml"] = k8sDeploymentCode;
    files["k8s-service.yaml"] = k8sServiceCode;
  }

  // Pre-calculate realistic fallback cost estimations
  const freeTier = sanitized.instanceType === "t2.micro" || sanitized.instanceType === "t3.micro";
  const estimatedCosts = {
    ec2: freeTier ? 0.00 : 8.50,
    s3: freeTier ? 0.00 : 1.20,
    cloudfront: sanitized.enableCloudFront ? 2.50 : 0.00,
    rds: sanitized.databaseType !== 'None' && sanitized.databaseType !== 'DynamoDB' ? (freeTier ? 0.00 : 15.00) : 0.00,
    lambda: 0.00,
    total: 0.00
  };
  estimatedCosts.total = parseFloat(
    Object.values(estimatedCosts).reduce((acc, curr) => acc + curr, 0).toFixed(2)
  );

  // Fallback recommendations formatting
  const recommendations = [
    {
      title: "Optimized Instance Selection",
      reason: `Provisioning t2.micro for region ${sanitized.region} fits within standard AWS Free Tier allocations.`
    },
    {
      title: "Storage Consolidation",
      reason: `S3 Bucket named ${sanitized.storageBucket} is declared as the asset storage backend.`
    }
  ];

  // Fallback Mermaid diagram
  const diagramSpec = {
    type: "mermaid",
    content: `graph TD
  User(["User Client"]) -->|HTTPS| ALB["Load Balancer"]
  ALB -->|API Port ${sanitized.containerPort}| EC2_App["EC2 Instance (app)"]
  EC2_App -->|Query| DB[("${sanitized.databaseType} Database")]`
  };

  return {
    recommendations,
    estimatedCosts,
    diagramSpec,
    files
  };
}

module.exports = {
  generateMergedTemplates,
  defaultParams
};
