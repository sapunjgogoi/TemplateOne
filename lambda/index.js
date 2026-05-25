// lambda/index.js - AWS Lambda Handler with Resilient Hybrid AI Parameter Merging
const { z } = require('zod');
const { generateMergedTemplates } = require('../templates/baseTemplates');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

// Unique request ID helper
function generateRequestId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
}

// Structured Logging helper
function logStructured(requestId, level, eventType, message, data = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    level,
    eventType,
    message,
    ...data
  }));
}

// Basic HCL brace-matching check for Terraform files
function validateHCLSyntax(code) {
  let openBraces = 0;
  let closeBraces = 0;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') openBraces++;
    if (code[i] === '}') closeBraces++;
  }
  return openBraces === closeBraces;
}

// Safe JSON cleaning function to extract strict JSON blocks from Gemini responses
function safeJsonParse(rawText, requestId) {
  let cleaned = rawText.trim();
  
  // Clean markdown fence blocks (e.g. ```json ... ```)
  if (cleaned.includes('```')) {
    logStructured(requestId, "WARN", "SAFE_JSON_PARSE_WARNING", "Detected backticks or markdown wrap in response");
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();
  
  // Extract content between the first { and the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return JSON.parse(cleaned);
}

// Define the expected Zod Schema
const recommendationSchema = z.object({
  title: z.string(),
  reason: z.string()
});

const estimatedCostsSchema = z.object({
  ec2: z.number(),
  s3: z.number(),
  cloudfront: z.number(),
  rds: z.number(),
  lambda: z.number(),
  total: z.number()
});

const parametersSchema = z.object({
  projectName: z.string(),
  instanceType: z.string(),
  region: z.string(),
  containerPort: z.number().int(),
  replicas: z.number().int(),
  databaseType: z.string(),
  dockerImage: z.string(),
  storageBucket: z.string(),
  enableCloudFront: z.boolean(),
  enableDocker: z.boolean(),
  enableKubernetes: z.boolean()
});

const diagramSpecSchema = z.object({
  type: z.string(),
  content: z.string()
});

const geminiResponseSchema = z.object({
  recommendations: z.array(recommendationSchema),
  parameters: parametersSchema,
  estimatedCosts: estimatedCostsSchema,
  diagramSpec: diagramSpecSchema
});

// Handler function mimicking AWS Lambda signature
async function handler(event) {
  const requestId = generateRequestId();
  logStructured(requestId, "INFO", "LAMBDA_START", "AWS Lambda execution started");

  // Normalize body depending on invocation context
  let requestBody = {};
  try {
    if (event.body) {
      requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      requestBody = event;
    }
  } catch (err) {
    logStructured(requestId, "ERROR", "INVALID_REQUEST_PAYLOAD", "Failed to parse request payload", { error: err.message });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid request payload" })
    };
  }

  // Extract parameters
  const {
    projectName = "aws-cloud-app",
    projectType = "MERN",
    frontendType = "React",
    backendType = "Node.js",
    databaseType = "PostgreSQL",
    trafficLevel = "Low",
    freeTierSafe = true,
    devopsFeatures = []
  } = requestBody;

  const apiKey = process.env.GEMINI_API_KEY;
  const enforceFreeTier = freeTierSafe === true || freeTierSafe === 'true';

  // Helper to fallback gracefully
  const triggerFallback = (reason) => {
    logStructured(requestId, "WARN", "FALLBACK_TRIGGERED", `Applying offline templates fallback: ${reason}`);
    
    // Fallback parameters based on user selections
    const fallbackParams = {
      projectName,
      region: "us-east-1",
      instanceType: enforceFreeTier ? "t2.micro" : "t2.small",
      containerPort: 5000,
      replicas: enforceFreeTier ? 1 : 2,
      databaseType,
      dockerImage: "node:18-alpine",
      storageBucket: `${projectName}-storage-bucket`,
      enableCloudFront: false,
      enableDocker: devopsFeatures.includes("Docker Compose"),
      enableKubernetes: devopsFeatures.includes("Kubernetes (EKS)")
    };

    const fallbackData = generateMergedTemplates(fallbackParams);
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ...fallbackData,
        fallbackActive: true,
        fallbackReason: reason
      })
    };
  };

  // If no API key configured, use local blueprints
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return triggerFallback("Gemini API key is not configured");
  }

  // Load Prompts from Versioned Files
  let systemPrompt = "";
  let userPromptTemplate = "";
  try {
    const systemPromptPath = path.join(__dirname, 'prompts', 'system_prompt_v2.txt');
    const userPromptPath = path.join(__dirname, 'prompts', 'user_prompt_v2.txt');
    systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    userPromptTemplate = fs.readFileSync(userPromptPath, 'utf8');
    logStructured(requestId, "INFO", "PROMPTS_LOADED", "Versioned prompt files loaded successfully");
  } catch (err) {
    logStructured(requestId, "ERROR", "PROMPTS_LOAD_FAILED", "Failed to load versioned prompt files", { error: err.message });
    return triggerFallback("Failed to load backend system prompts");
  }

  // Replace double curly placeholders in the user prompt template
  const replacements = {
    PROJECT_TYPE: projectType,
    FRONTEND_TYPE: frontendType,
    BACKEND_TYPE: backendType,
    PROJECT_NAME: projectName,
    DATABASE_TYPE: databaseType,
    TRAFFIC_LEVEL: trafficLevel,
    FREE_TIER_SAFE: enforceFreeTier ? "Yes" : "No",
    REGION: enforceFreeTier ? "us-east-1" : "ap-south-1",
    ENABLE_DOCKER: devopsFeatures.includes("Docker Compose") ? "Yes" : "No",
    ENABLE_KUBERNETES: devopsFeatures.includes("Kubernetes (EKS)") ? "Yes" : "No"
  };

  let userPrompt = userPromptTemplate;
  for (const [key, val] of Object.entries(replacements)) {
    userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
  }

  // AI Invocation Loop with Retry and Timeout Protection
  let attempts = 0;
  const maxAttempts = 2;
  let success = false;
  let aiPayload = null;
  let lastErrorMsg = "";

  while (attempts < maxAttempts && !success) {
    attempts++;
    logStructured(requestId, "INFO", "GEMINI_API_ATTEMPT", `Attempting Gemini API call ${attempts}/${maxAttempts}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logStructured(requestId, "WARN", "GEMINI_API_TIMEOUT", `Timeout reached (20s) on attempt ${attempts}`);
      controller.abort();
    }, 20000); // 20-second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                recommendations: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      reason: { type: "STRING" }
                    },
                    required: ["title", "reason"]
                  }
                },
                parameters: {
                  type: "OBJECT",
                  properties: {
                    projectName: { type: "STRING" },
                    instanceType: { type: "STRING" },
                    region: { type: "STRING" },
                    containerPort: { type: "INTEGER" },
                    replicas: { type: "INTEGER" },
                    databaseType: { type: "STRING" },
                    dockerImage: { type: "STRING" },
                    storageBucket: { type: "STRING" },
                    enableCloudFront: { type: "BOOLEAN" },
                    enableDocker: { type: "BOOLEAN" },
                    enableKubernetes: { type: "BOOLEAN" }
                  },
                  required: ["projectName", "instanceType", "region", "containerPort", "replicas", "databaseType", "dockerImage", "storageBucket", "enableCloudFront", "enableDocker", "enableKubernetes"]
                },
                estimatedCosts: {
                  type: "OBJECT",
                  properties: {
                    ec2: { type: "NUMBER" },
                    s3: { type: "NUMBER" },
                    cloudfront: { type: "NUMBER" },
                    rds: { type: "NUMBER" },
                    lambda: { type: "NUMBER" },
                    total: { type: "NUMBER" }
                  },
                  required: ["ec2", "s3", "cloudfront", "rds", "lambda", "total"]
                },
                diagramSpec: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING" },
                    content: { type: "STRING" }
                  },
                  required: ["type", "content"]
                }
              },
              required: ["recommendations", "parameters", "estimatedCosts", "diagramSpec"]
            }
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.candidates || result.candidates.length === 0 || !result.candidates[0].content) {
        throw new Error("Empty response returned by Gemini API");
      }

      const rawText = result.candidates[0].content.parts[0].text;
      
      // Safe Clean & Parse
      const parsedData = safeJsonParse(rawText, requestId);
      
      // Zod Validation
      const validatedData = geminiResponseSchema.safeParse(parsedData);
      
      if (!validatedData.success) {
        const validationError = validatedData.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        logStructured(requestId, "ERROR", "GEMINI_VALIDATION_FAILED", "JSON payload failed Zod schema enforcement", { errors: validationError });
        throw new Error(`Zod validation failed: ${validationError}`);
      }

      aiPayload = validatedData.data;
      success = true;
      logStructured(requestId, "INFO", "GEMINI_SUCCESS", "Successfully fetched and validated Gemini parameters");
    } catch (err) {
      clearTimeout(timeoutId);
      lastErrorMsg = err.message;
      logStructured(requestId, "WARN", "GEMINI_ATTEMPT_ERROR", `Failed attempt ${attempts}/${maxAttempts}`, { error: err.message });
    }
  }

  if (!success) {
    return triggerFallback(`Gemini generation failed: ${lastErrorMsg}`);
  }

  // Override instance and database sizes if Free Tier Safe Mode is toggled to ensure safety
  if (enforceFreeTier) {
    logStructured(requestId, "INFO", "FREE_TIER_OVERRIDE", "Enforcing free-tier constraints on parameter sizing");
    aiPayload.parameters.instanceType = "t2.micro";
    aiPayload.parameters.replicas = 1;
    aiPayload.estimatedCosts = {
      ec2: 0,
      s3: 0,
      cloudfront: 0,
      rds: 0,
      lambda: 0,
      total: 0
    };
  }

  // Run Backend Merging Logic
  let mergedBlueprints;
  try {
    mergedBlueprints = generateMergedTemplates(aiPayload.parameters);
  } catch (mergeError) {
    logStructured(requestId, "ERROR", "TEMPLATE_MERGE_FAILED", "Failed to merge parameters into blueprints", { error: mergeError.message });
    return triggerFallback(`Blueprints merging failed: ${mergeError.message}`);
  }

  // Validate Merged Blueprint Output (Syntax + Placeholder Validation)
  try {
    // 1. Scan all files for unresolved placeholders e.g. {{AMI_ID}} or {{PROJECT_NAME}}
    const placeholderRegex = /{{[A-Z0-9_]+}}/;
    for (const [filename, content] of Object.entries(mergedBlueprints.files)) {
      if (placeholderRegex.test(content)) {
        const matched = content.match(placeholderRegex)[0];
        logStructured(requestId, "ERROR", "PLACEHOLDER_VALIDATION_FAILED", `Found unresolved placeholder in ${filename}`, { placeholder: matched });
        throw new Error(`Unresolved placeholder '${matched}' detected in file ${filename}`);
      }
    }

    // 2. Validate Docker Compose YAML syntax
    if (mergedBlueprints.files["docker-compose.yml"]) {
      const composeDocs = YAML.parseAllDocuments(mergedBlueprints.files["docker-compose.yml"]);
      const composeErrors = composeDocs.flatMap(doc => doc.errors || []);
      if (composeErrors.length > 0) {
        throw new Error(`Docker Compose YAML parsing failed: ${composeErrors[0].message}`);
      }
    }

    // 3. Validate Kubernetes deployment and service YAML syntax (supports multiple docs)
    if (mergedBlueprints.files["k8s-deployment.yaml"]) {
      const k8sDocs = YAML.parseAllDocuments(mergedBlueprints.files["k8s-deployment.yaml"]);
      const k8sErrors = k8sDocs.flatMap(doc => doc.errors || []);
      if (k8sErrors.length > 0) {
        throw new Error(`Kubernetes manifest YAML parsing failed: ${k8sErrors[0].message}`);
      }
    }
    if (mergedBlueprints.files["k8s-service.yaml"]) {
      const k8sSrvDocs = YAML.parseAllDocuments(mergedBlueprints.files["k8s-service.yaml"]);
      const k8sSrvErrors = k8sSrvDocs.flatMap(doc => doc.errors || []);
      if (k8sSrvErrors.length > 0) {
        throw new Error(`Kubernetes service YAML parsing failed: ${k8sSrvErrors[0].message}`);
      }
    }

    // 4. Validate CloudFormation YAML syntax
    if (mergedBlueprints.files["cloudformation.yaml"]) {
      const cfDocs = YAML.parseAllDocuments(mergedBlueprints.files["cloudformation.yaml"]);
      const cfErrors = cfDocs.flatMap(doc => doc.errors || []);
      if (cfErrors.length > 0) {
        throw new Error(`CloudFormation template YAML parsing failed: ${cfErrors[0].message}`);
      }
    }

    // 5. Validate Terraform braces
    if (mergedBlueprints.files["terraform.tf"]) {
      if (!validateHCLSyntax(mergedBlueprints.files["terraform.tf"])) {
        throw new Error("Terraform configuration has unmatched braces");
      }
    }

    logStructured(requestId, "INFO", "SYNTAX_VALIDATION_SUCCESS", "All customized templates passed syntax and placeholder tests");
  } catch (syntaxError) {
    logStructured(requestId, "ERROR", "SYNTAX_VALIDATION_FAILED", "Customized templates failed post-merge validation", { error: syntaxError.message });
    return triggerFallback(`Post-merge template validation failed: ${syntaxError.message}`);
  }

  logStructured(requestId, "INFO", "LAMBDA_SUCCESS", "Lambda execution completed successfully");

  // Return success response
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      recommendations: aiPayload.recommendations,
      estimatedCosts: aiPayload.estimatedCosts,
      diagramSpec: aiPayload.diagramSpec,
      files: mergedBlueprints.files,
      fallbackActive: false
    })
  };
}

module.exports = { handler };
