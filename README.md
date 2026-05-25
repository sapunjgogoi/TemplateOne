# TemplateOne: AWS Template Creator (v2 Hybrid-AI)

An interactive, full-stack, AI-powered cloud architecture planner designed to help beginners draft secure, compliant, and cost-effective AWS infrastructure configurations.

By implementing a **Hybrid AI Generation System**, the application combines pre-tested, syntactically correct local templates for Terraform, Docker Compose, Kubernetes, and CloudFormation with dynamic customizations computed by **Google Gemini 2.5 API** parameters.

---

## Key Features

1. **Hybrid Code Integration**: Avoids AI configuration hallucinations by merging Gemini-optimized parameters (ports, db names, domains, replicas) into local pre-tested blueprint definitions.
2. **AWS Free Tier Safe Mode**: Enforces strict resource limitations on the frontend and backend (e.g., locking types to `t2.micro` or `db.t3.micro` databases) to guarantee $0/month deployment plans.
3. **Interactive Diagrams**: Generates dynamic visual architecture flowcharts on-the-fly using Mermaid.js rendering.
4. **Syntax & Schema Verification**: Enforces Gemini JSON responses against strict schemas, checks YAML structures, and validates Terraform block closures before presentation.
5. **Secure Local Proxy**: Processes requests via a local Express proxy that simulates an AWS Lambda execution context, safeguarding API credentials from client visibility.
6. **Robust Fallback & Caching**: Cache repeated layout searches for 1 hour to optimize token usage. If the Gemini API is offline or keyless, the system recovers instantly using local heuristics.

---

## Directory Structure

```text
├── templates/
│   ├── pricing.json         # Shared AWS resources costing rules
│   └── baseTemplates.js     # Parameterized Docker/K8s/TF/CF blueprints
├── lambda/
│   └── index.js             # AWS-ready Lambda generation handler
├── backend/
│   ├── server.js            # Express server (Lambda simulation, caching & security)
│   ├── .env                 # Environment configurations (Port & Gemini API key)
│   └── package.json         # Node server dependencies
└── frontend/
    ├── src/                 # React frontend dashboard components
    ├── tailwind.config.js   # Tailwind style declarations
    └── package.json         # React packages (Mermaid, JSZip, Lucide icons)
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- NPM (installed automatically with Node)

---

### Step 1: Set Up Backend Proxy

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Open the `.env` file and input your Google Gemini API key:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```

*Note: If no API key is provided, the backend automatically transitions to local rules engine mode and continues running out-of-the-box.*

---

### Step 2: Set Up Frontend Dashboard

1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the provided Vite port (usually `http://localhost:5173`).

---

## Verification Suite

To verify that the implementation is running correctly:
1. **Mock Fallback Check**: Run the generator without adding a Gemini API Key in `backend/.env`. The generator should immediately load valid static templates with a warning banner indicating that offline templates are active.
2. **Free Tier Restriction Check**: Toggle the "Free Tier Safe Mode" switch. The instance configurations in the Cost Playground should cap at $0.00 and lock selector parameters automatically.
3. **ZIP Packaging Check**: Generate templates and click "Download All". A zip file containing structured templates (`terraform.tf`, `docker-compose.yml`, `k8s-deployment.yaml`, `cloudformation.yaml`, `README.md`, and a JSON manifest) should download client-side.

---

## CI/CD Secrets Setup
To deploy this project successfully via GitHub Actions, ensure you have configured the following Repository Secrets:
* `DOCKER_USERNAME` / `DOCKER_PASSWORD`: Docker Hub credentials.
* `EC2_HOST` / `EC2_SSH_KEY`: SSH details to access the AWS EC2 instance.
* `GEMINI_API_KEY`: API key for Google Gemini model generation.
* `CLERK_PUBLISHABLE_KEY`: The frontend publishable key for user session context.
* `CLERK_SECRET_KEY`: The backend secret key for authentication verification.

