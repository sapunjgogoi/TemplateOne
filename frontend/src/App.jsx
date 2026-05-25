import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Home, 
  Settings2, 
  DollarSign, 
  Info, 
  Layers, 
  Server, 
  Database, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import RequirementForm from './components/RequirementForm';
import CodeViewer from './components/CodeViewer';
import CostCalculator from './components/CostCalculator';
import DiagramViewer from './components/DiagramViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Light/Dark Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Form State
  const [formData, setFormData] = useState({
    projectName: 'my-cloud-app',
    projectType: 'MERN',
    frontendType: 'React',
    backendType: 'Node.js',
    databaseType: 'MongoDB',
    trafficLevel: 'Low',
    freeTierSafe: true, // Default to true
    devopsFeatures: ['Docker Compose', 'Terraform (IaC)']
  });

  // Response State
  const [apiResponse, setApiResponse] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
      // Switch to generator view to view code
      setActiveTab('generator');
    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed to connect to backend server: ${err.message}. Make sure the backend Express server is running on port 5000.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Navigation Header */}
      <header className="bg-[var(--header-bg)]/80 backdrop-blur-md border-b border-[var(--border-color)] sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-cobaltBlue p-2 rounded-xl text-white shadow-glowCobalt">
            <Cloud size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-[var(--text-color)] flex items-center gap-2">
              TemplateOne <span className="text-[10px] bg-cobaltBlue-dark px-2 py-0.5 rounded-full font-semibold text-white">AWS v2</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">AI-Powered Cloud Architect Dashboard</p>
          </div>
        </div>

        {/* Global Tabs */}
        <nav className="flex items-center gap-1 md:gap-2">
          {[
            { id: 'home', label: 'Onboarding', icon: Home },
            { id: 'generator', label: 'Generator', icon: Settings2 },
            { id: 'costs', label: 'Cost Playground', icon: DollarSign },
            { id: 'about', label: 'AWS Help', icon: Info },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-cobaltBlue text-white shadow-glowCobalt'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--input-bg)]'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Free Tier Indicator Switch */}
          <div className="flex items-center gap-2 bg-[var(--input-bg)] px-3.5 py-2 rounded-xl border border-[var(--border-color)] transition-colors duration-300">
            <span className="text-[10px] md:text-xs text-[var(--text-color)] font-semibold">Free Tier Safe</span>
            <button
              onClick={() => setFormData(p => ({ ...p, freeTierSafe: !p.freeTierSafe }))}
              className={`w-9 h-5 rounded-full transition-all relative ${
                formData.freeTierSafe ? 'bg-emeraldNeon' : 'bg-slate-700'
              }`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                formData.freeTierSafe ? 'left-[17px]' : 'left-[4px]'
              }`} />
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] hover:bg-[var(--card-bg)] transition-all text-[var(--text-color)] flex items-center justify-center h-[38px] w-[38px]"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Beta Disclaimer Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-left">
            <h4 className="text-amber-500 font-bold text-sm">Caution: Project Under Development</h4>
            <p className="text-[var(--text-color)] text-xs mt-1 leading-relaxed">
              TemplateOne is still in progress. AI-generated configurations, parameters, costs, and Mermaid blueprints **are not always correct**. Please be cautious, double-check all settings, and verify compliance before deploying resources.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-left">
              <h4 className="text-red-500 font-bold text-sm">Connectivity Alert</h4>
              <p className="text-[var(--text-color)] text-xs mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* TAB 1: Onboarding / Home */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="glass-panel rounded-3xl p-8 border-[var(--border-color)] relative overflow-hidden bg-gradient-to-r from-[var(--card-bg)] to-[var(--card-bg)]/40">
              <div className="max-w-2xl space-y-4">
                <span className="text-xs text-cobaltBlue-light font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cobaltBlue rounded-full animate-ping" />
                  DevOps Interactive Workspace
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-color)] leading-tight">
                  Design & Deploy Validated AWS Stacks Instantly.
                </h2>
                <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed">
                  Avoid cloud architecture configuration errors. Our Hybrid AI system merges Gemini 2.5 optimized parameters into statically tested local blueprints.
                </p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="bg-cobaltBlue hover:bg-cobaltBlue-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-glowCobalt"
                >
                  Launch Template Creator
                </button>
              </div>
            </div>

            {/* Quick Flow Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Choose Project & DB', desc: 'Select standard stacks like MERN or FastAPI, databases, and expected monthly transaction sizes.', icon: Layers },
                { step: '02', title: 'Toggle Safe Mode', desc: 'Activate AWS Free Tier Mode to auto-cap EC2/RDS sizes and prevent surprise hosting bills.', icon: CheckCircle },
                { step: '03', title: 'Generate & Deploy', desc: 'Download fully-linked Terraform, Docker, K8s, and CloudFormation setups in a single ZIP package.', icon: Server }
              ].map((flow, i) => {
                const Icon = flow.icon;
                return (
                  <div key={i} className="glass-panel rounded-2xl p-6 border-[var(--border-color)] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-extrabold text-slate-500/30">{flow.step}</span>
                      <Icon className="text-cobaltBlue" size={20} />
                    </div>
                    <h3 className="font-bold text-[var(--text-color)] text-base">{flow.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed">{flow.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* AWS Core Services Index */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[var(--text-color)]">AWS Reference Guide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'EC2 Compute', detail: 'Elastic Compute servers. Configured using Amazon Linux 2 AMI.', color: 'border-blue-500/20' },
                  { name: 'RDS Managed Database', detail: 'Automated PostgreSQL/MySQL database backups & provisioning.', color: 'border-emerald-500/20' },
                  { name: 'S3 Object Storage', detail: 'High-availability storage for static websites & media assets.', color: 'border-amber-500/20' },
                  { name: 'CloudFront CDN', detail: 'Global cache distribution layer securing HTTPS API routing.', color: 'border-purple-500/20' }
                ].map((aws, i) => (
                  <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 space-y-2">
                    <h4 className="font-bold text-sm text-[var(--text-color)]">{aws.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-normal">{aws.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Template Generator */}
        {activeTab === 'generator' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-1">
                <RequirementForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSubmit={handleGenerate} 
                  isGenerating={isGenerating} 
                />
              </div>

              {/* Outputs (Diagram & Code Viewer) */}
              <div className="lg:col-span-2 space-y-6">
                {apiResponse ? (
                  <>
                    <DiagramViewer diagramSpec={apiResponse.diagramSpec} />
                    <CodeViewer 
                      files={apiResponse.files} 
                      recommendations={apiResponse.recommendations} 
                      fallbackActive={apiResponse.fallbackActive}
                      fallbackReason={apiResponse.fallbackReason}
                      projectName={formData.projectName}
                    />
                  </>
                ) : (
                  <div className="glass-panel rounded-2xl p-12 text-center text-[var(--text-muted)] border-[var(--border-color)] h-full flex flex-col justify-center items-center">
                    <Cloud className="text-[var(--text-muted)] mb-4 animate-pulse" size={54} />
                    <h3 className="font-bold text-[var(--text-color)] text-base">Templates and Architecture Diagram Not Generated</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-2 max-w-sm">
                      Configure your cloud stack preferences in the left panel and click the generate button.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Cost Playground */}
        {activeTab === 'costs' && (
          <div className="animate-fade-in">
            <CostCalculator 
              generatedCosts={apiResponse ? apiResponse.estimatedCosts : null} 
              freeTierSafe={formData.freeTierSafe} 
            />
          </div>
        )}

        {/* TAB 4: About / Help */}
        {activeTab === 'about' && (
          <div className="glass-panel rounded-2xl p-6 md:p-8 border-[var(--border-color)] space-y-6 text-left animate-fade-in">
            <h3 className="font-bold text-[var(--text-color)] text-xl flex items-center gap-2">
              <HelpCircle className="text-cobaltBlue" size={22} />
              AWS Free Tier Guide
            </h3>
            <p className="text-[var(--text-color)] text-sm leading-relaxed">
              New AWS accounts receive access to various free tier limits for the first 12 months. Keeping resources within these boundaries prevents your credit card from being billed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="font-bold text-emeraldNeon text-sm uppercase">Active Limits</h4>
                <ul className="space-y-3 text-xs text-[var(--text-muted)] leading-normal">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-emeraldNeon mt-0.5 flex-shrink-0" size={14} />
                    <span><strong>EC2 instances</strong>: 750 hours/month of Linux `t2.micro` or `t3.micro`.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-emeraldNeon mt-0.5 flex-shrink-0" size={14} />
                    <span><strong>RDS Databases</strong>: 750 hours/month of Single-AZ `db.t2.micro` or `db.t3.micro` engines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-emeraldNeon mt-0.5 flex-shrink-0" size={14} />
                    <span><strong>S3 Standard Storage</strong>: 5GB storage capacity, with 20k GET and 2k PUT requests.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-emeraldNeon mt-0.5 flex-shrink-0" size={14} />
                    <span><strong>CloudFront CDN</strong>: 1TB bandwidth data transfer out.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-emeraldNeon mt-0.5 flex-shrink-0" size={14} />
                    <span><strong>AWS Lambda</strong>: 1 million executions and 400,000 GB-seconds compute.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-[var(--text-color)] text-sm">Deployment Checklists</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Before applying Terraform configurations on AWS:
                </p>
                <div className="bg-[var(--editor-bg)] p-3 rounded-lg border border-[var(--border-color)] font-mono text-[10px] text-slate-200">
                  # 1. Login with AWS CLI<br />
                  aws configure<br /><br />
                  # 2. Deploy infrastructure<br />
                  terraform init<br />
                  terraform apply
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--header-bg)] border-t border-[var(--border-color)] py-6 text-center text-[10px] text-[var(--text-muted)]/60 transition-colors duration-300">
        <p>© 2026 All rights reserved</p>
      </footer>
    </div>
  );
}
