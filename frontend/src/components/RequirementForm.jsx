import React, { useEffect } from 'react';
import { Shield, Sparkles, Layers, Database, Activity, Terminal, AlertTriangle } from 'lucide-react';

const PROJECT_TYPES = [
  { id: 'MERN', name: 'MERN Stack', desc: 'React Frontend, Node.js Backend, MongoDB database', icon: Layers },
  { id: 'Python API', name: 'Python FastAPI', desc: 'FastAPI, Uvicorn server, PostgreSQL database', icon: Terminal },
  { id: 'Serverless', name: 'Serverless App', desc: 'S3 static frontend, API Gateway, DynamoDB', icon: Sparkles },
  { id: 'Static Web', name: 'Static Web App', desc: 'React/HTML hosted on S3 and distributed via CloudFront', icon: Shield },
  { id: 'LAMP', name: 'LAMP Stack', desc: 'Traditional PHP web app, Apache, MySQL database', icon: Layers },
  { id: 'Spring Boot', name: 'Spring Boot', desc: 'Java enterprise back-end, PostgreSQL database', icon: Database }
];

const DATABASES = ['PostgreSQL', 'MongoDB', 'MySQL', 'DynamoDB', 'None'];
const TRAFFIC_LEVELS = [
  { level: 'Low', desc: 'Under 10k visits/mo. Runs on single free-tier instances.' },
  { level: 'Medium', desc: '10k - 100k visits/mo. Dual subnets, Multi-AZ RDS.' },
  { level: 'High', desc: '100k+ visits/mo. Auto-scaling, EKS clusters, NAT gateways.' }
];

export default function RequirementForm({ formData, setFormData, onSubmit, isGenerating }) {
  
  // Enforce Free Tier overrides
  useEffect(() => {
    if (formData.freeTierSafe) {
      const updated = { ...formData };
      let changed = false;

      if (formData.trafficLevel !== 'Low') {
        updated.trafficLevel = 'Low';
        changed = true;
      }
      if (formData.databaseType === 'DynamoDB' && formData.projectType === 'MERN') {
        // Mongo is better for MERN, but PostgreSQL/MySQL RDS works too
      }
      
      if (changed) {
        setFormData(updated);
      }
    }
  }, [formData.freeTierSafe]);

  const handleProjectTypeChange = (typeId) => {
    const type = PROJECT_TYPES.find(t => t.id === typeId);
    let defaults = { projectType: typeId };

    if (typeId === 'MERN') {
      defaults.frontendType = 'React';
      defaults.backendType = 'Node.js';
      defaults.databaseType = 'MongoDB';
    } else if (typeId === 'Python API') {
      defaults.frontendType = 'React';
      defaults.backendType = 'Python FastAPI';
      defaults.databaseType = 'PostgreSQL';
    } else if (typeId === 'Serverless') {
      defaults.frontendType = 'React';
      defaults.backendType = 'AWS Lambda';
      defaults.databaseType = 'DynamoDB';
    } else if (typeId === 'Static Web') {
      defaults.frontendType = 'React';
      defaults.backendType = 'None/Static';
      defaults.databaseType = 'None';
    } else if (typeId === 'LAMP') {
      defaults.frontendType = 'HTML/JS';
      defaults.backendType = 'PHP';
      defaults.databaseType = 'MySQL';
    } else if (typeId === 'Spring Boot') {
      defaults.frontendType = 'React';
      defaults.backendType = 'Java';
      defaults.databaseType = 'PostgreSQL';
    }

    setFormData(prev => ({ ...prev, ...defaults }));
  };

  const toggleDevopsFeature = (feature) => {
    setFormData(prev => {
      const active = prev.devopsFeatures.includes(feature)
        ? prev.devopsFeatures.filter(f => f !== feature)
        : [...prev.devopsFeatures, feature];
      return { ...prev, devopsFeatures: active };
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 border-[var(--border-color)]">
      <div>
        <h2 className="text-xl font-bold tracking-wide text-[var(--text-color)] flex items-center gap-2">
          <Terminal className="text-cobaltBlue" size={22} />
          Configure Deployment Stack
        </h2>
        <p className="text-[var(--text-muted)] text-sm mt-1">Select cloud specifications and application parameters.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-color)]">Project Namespace</label>
          <input
            type="text"
            required
            pattern="[a-zA-Z0-9-]+"
            title="Only alphanumeric characters and hyphens allowed"
            placeholder="e.g. cloud-dashboard-app"
            value={formData.projectName}
            onChange={(e) => setFormData(p => ({ ...p, projectName: e.target.value.toLowerCase() }))}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] placeholder-slate-500 focus:outline-none focus:border-cobaltBlue transition-all text-sm"
          />
        </div>

        {/* Project Stack Presets */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
            <Layers className="text-cobaltBlue" size={16} />
            Architecture Stack
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.projectType === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => handleProjectTypeChange(type.id)}
                  className={`flex items-start text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cobaltBlue/10 border-cobaltBlue text-[var(--text-color)] shadow-glowCobalt'
                      : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-color)] hover:border-cobaltBlue/50 hover:bg-[var(--input-bg)]/50'
                  }`}
                  style={{ borderWidth: '1.5px' }}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-colors ${isSelected ? 'bg-cobaltBlue text-white shadow-glowCobalt' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm transition-colors ${isSelected ? 'text-cobaltBlue dark:text-cobaltBlue-light' : 'text-[var(--text-color)]'}`}>{type.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
              <Database className="text-cobaltBlue" size={16} />
              Database Engine
            </label>
            <select
              value={formData.databaseType}
              onChange={(e) => setFormData(p => ({ ...p, databaseType: e.target.value }))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-cobaltBlue text-sm transition-all"
            >
              {DATABASES.map(db => (
                <option key={db} value={db}>{db}</option>
              ))}
            </select>
          </div>

          {/* Traffic Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
              <Activity className="text-cobaltBlue" size={16} />
              Expected Traffic
            </label>
            <select
              disabled={formData.freeTierSafe}
              value={formData.trafficLevel}
              onChange={(e) => setFormData(p => ({ ...p, trafficLevel: e.target.value }))}
              className={`w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-cobaltBlue text-sm transition-all ${
                formData.freeTierSafe ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {TRAFFIC_LEVELS.map(t => (
                <option key={t.level} value={t.level}>
                  {t.level} ({t.level === 'Low' ? 'Free-Tier scale' : t.level === 'Medium' ? 'Multi-AZ' : 'Auto-scaling'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Free Tier Warnings */}
        {formData.freeTierSafe && (
          <div className="bg-emeraldNeon/10 border border-emeraldNeon/30 rounded-xl p-4 flex items-start gap-3">
            <Shield className="text-emeraldNeon mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h5 className="text-sm font-semibold text-emeraldNeon">AWS Free Tier Safe Mode Enabled</h5>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">
                Configurations are restricted to micro instances (`t2.micro` / `db.t2.micro`) and single AZs to guarantee zero active monthly hosting fees.
              </p>
            </div>
          </div>
        )}

        {/* DevOps Options */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[var(--text-color)]">Deployment Configs</label>
          <div className="grid grid-cols-2 gap-3">
            {['Docker Compose', 'Kubernetes (EKS)', 'Terraform (IaC)', 'CloudFormation'].map(tool => {
              const isChecked = formData.devopsFeatures.includes(tool);
              return (
                <button
                  type="button"
                  key={tool}
                  onClick={() => toggleDevopsFeature(tool)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isChecked
                      ? 'bg-emeraldNeon/10 border-emeraldNeon text-[var(--text-color)] shadow-glowEmerald font-semibold'
                      : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-color)] hover:border-emeraldNeon/50 hover:bg-[var(--input-bg)]/50'
                  }`}
                  style={{ borderWidth: '1.5px' }}
                >
                  <span>{tool}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isChecked ? 'bg-emeraldNeon border-emeraldNeon' : 'border-[var(--border-color)]'
                  }`}>
                    {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-cobaltBlue to-cobaltBlue-dark hover:from-cobaltBlue-dark hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-glowCobalt flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Cloud Blueprints...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate Templates</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
