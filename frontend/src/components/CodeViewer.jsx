import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, AlertCircle, FileText, Settings } from 'lucide-react';
import JSZip from 'jszip';

export default function CodeViewer({ files, recommendations, fallbackActive, fallbackReason, projectName }) {
  const [activeTab, setActiveTab] = useState(Object.keys(files || {})[0] || 'README.md');
  const [copied, setCopied] = useState(false);

  if (!files || Object.keys(files).length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-[var(--text-muted)] border-[var(--border-color)]">
        <FileCode className="mx-auto mb-3 text-[var(--text-muted)]/60" size={40} />
        <p>No configuration files generated yet. Fill out the form and click generate.</p>
      </div>
    );
  }

  const activeContent = files[activeTab] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // Add all templates to ZIP folder
      Object.entries(files).forEach(([filename, content]) => {
        zip.file(`${projectName}/${filename}`, content);
      });

      // Add a JSON manifest representing configuration parameters
      zip.file(`${projectName}/manifest.json`, JSON.stringify({
        project: projectName,
        exportedAt: new Date().toISOString(),
        generator: "AWS Template Creator v2 (Hybrid-AI)",
        fallbackActive
      }, null, 2));

      // Generate binary and download
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${projectName}-deployment-package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("ZIP Generation Failed:", err);
      alert("Failed to generate deployment package ZIP. Please try copying code manually.");
    }
  };

  // Determine icon based on file tab name
  const getTabIcon = (tabName) => {
    if (tabName.endsWith('.tf')) return <Settings size={14} className="text-blue-400" />;
    if (tabName.endsWith('.yml') || tabName.endsWith('.yaml')) return <FileCode size={14} className="text-emerald-400" />;
    return <FileText size={14} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Fallback Active Banner */}
      {fallbackActive && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h5 className="text-sm font-semibold text-amber-500">Offline / Local Template Applied</h5>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">
              The AI generation system gracefully fell back to local blueprints. 
              {fallbackReason && ` Reason: ${fallbackReason}`}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture recommendations */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border-[var(--border-color)] flex flex-col h-[500px]">
          <h3 className="font-bold text-[var(--text-color)] text-base border-b border-[var(--border-color)] pb-3 mb-4 flex items-center gap-2">
            <AlertCircle className="text-cobaltBlue" size={16} />
            Cloud Architect Notes
          </h3>
          <div className="flex-1 overflow-y-auto text-[var(--text-color)] text-sm leading-relaxed space-y-4 pr-1">
            {Array.isArray(recommendations) ? (
              recommendations.map((rec, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-[var(--text-color)] font-bold text-sm mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cobaltBlue rounded-full" />
                    {rec.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] ml-3 leading-normal">{rec.reason}</p>
                </div>
              ))
            ) : (
              typeof recommendations === 'string' ? (
                recommendations.split('\n').map((line, i) => {
                  if (line.startsWith('###')) {
                    return <h4 key={i} className="text-[var(--text-color)] font-bold text-sm mt-3">{line.replace('###', '').trim()}</h4>;
                  }
                  if (line.startsWith('-')) {
                    return <li key={i} className="ml-4 list-disc mt-1 text-[var(--text-muted)]">{line.replace('-', '').trim()}</li>;
                  }
                  return <p key={i} className="mt-1 text-[var(--text-muted)]">{line}</p>;
                })
              ) : null
            )}
          </div>
        </div>

        {/* Code workspace */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border-[var(--border-color)] flex flex-col overflow-hidden h-[500px]">
          {/* Header/Tab Bar */}
          <div className="bg-[var(--header-bg)] border-b border-[var(--border-color)] px-4 py-2 flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              {Object.keys(files).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                  }`}
                >
                  {getTabIcon(tab)}
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--input-bg)] transition-all text-[var(--text-muted)] hover:text-[var(--text-color)] flex items-center gap-1"
                title="Copy current file to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emeraldNeon" />
                    <span className="text-[10px] text-emeraldNeon font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>

              {/* Download */}
              <button
                onClick={handleDownloadZip}
                className="p-1.5 rounded-lg bg-emeraldNeon hover:bg-emeraldNeon-dark transition-all text-white flex items-center gap-1 font-bold"
                title="Download entire project package ZIP"
              >
                <Download size={14} />
                <span className="text-[10px]">Download All</span>
              </button>
            </div>
          </div>

          {/* Terminal Editor */}
          <div className="flex-1 bg-[var(--editor-bg)] p-4 overflow-auto relative">
            <pre className="text-xs text-slate-200 leading-relaxed font-mono select-text text-left">
              {activeContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
