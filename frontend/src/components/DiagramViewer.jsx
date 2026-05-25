import React, { useEffect, useRef, useState } from 'react';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';

// Initialize Mermaid globally
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#161B26',
    primaryColor: '#2563EB',
    primaryTextColor: '#F1F5F9',
    lineColor: '#262E3D',
    edgeLabelBackground: '#0B0F19'
  }
});

let diagramCounter = 0; // ensure unique IDs for each render

// Sanitizes the Mermaid spec by wrapping unquoted node labels in double quotes.
// This prevents syntax parser crashes on characters like parentheses or spaces.
function sanitizeMermaidSpec(spec) {
  if (!spec) return '';
  let cleaned = spec;
  // Wrap unquoted labels in brackets with quotes
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\[\(([^"\]\)]+)\)\]/g, '$1[("$2")]');
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\(\(([^"\(]+)\)\)/g, '$1(("$2"))');
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\[([^"\]]+)\]/g, '$1["$2"]');
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\(([^"\(]+)\)/g, '$1("$2")');
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\{([^"\}]+)\}/g, '$1{"$2"}');
  return cleaned;
}

export default function DiagramViewer({ diagramSpec }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!diagramSpec) return;

    const renderDiagram = async () => {
      setRendering(true);
      setError(false);
      
      let specStr = '';
      if (typeof diagramSpec === 'object' && diagramSpec !== null) {
        specStr = diagramSpec.content || '';
      } else if (typeof diagramSpec === 'string') {
        specStr = diagramSpec;
      }
      
      const cleanSpec = sanitizeMermaidSpec(specStr.trim()) || `graph TD\n  Client["User Client"] --> LoadBalancer["ALB"]\n  LoadBalancer --> Web["EC2 Instance"]`;
      const id = `mermaid-chart-${++diagramCounter}`;

      try {
        // Clear container first
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Render diagram to SVG
        const { svg } = await mermaid.render(id, cleanSpec);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError(true);
        
        // Try fallback default rendering
        try {
          const fallbackId = `mermaid-fallback-${++diagramCounter}`;
          const fallbackSpec = `graph TD
  User(["User Client"]) -->|HTTPS| ALB["Load Balancer"]
  ALB -->|Web Port| WebServer["EC2 Web Server"]
  WebServer -->|Query| DB[("RDS Database")]
`;
          const { svg } = await mermaid.render(fallbackId, fallbackSpec);
          setSvgContent(svg);
        } catch (fallbackErr) {
          console.error("Mermaid Fallback Render Error:", fallbackErr);
        }
      } finally {
        setRendering(false);
      }
    };

    renderDiagram();
  }, [diagramSpec]);

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 border-[var(--border-color)] space-y-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[var(--text-color)] text-base flex items-center gap-2">
            <Activity className="text-emeraldNeon animate-pulse" size={18} />
            Visual Architecture Blueprint
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Interactive architecture flowchart mapped from your stack requirements.</p>
        </div>
        
        {rendering && (
          <div className="flex items-center gap-1.5 text-xs text-cobaltBlue-light">
            <RefreshCw className="animate-spin" size={12} />
            <span>Rendering...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-500">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>Invalid diagram format received. Displaying fallback architecture diagram.</span>
        </div>
      )}

      {/* Render area */}
      <div className="w-full bg-[#0B0F19] rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-center min-h-[300px] overflow-auto">
        {svgContent ? (
          <div 
            className="w-full max-w-lg select-none flex justify-center text-center [&>svg]:w-full [&>svg]:h-auto text-slate-200"
            dangerouslySetInnerHTML={{ __html: svgContent }} 
          />
        ) : (
          <div className="text-slate-500 text-sm">Waiting for architecture layout...</div>
        )}
      </div>
    </div>
  );
}
