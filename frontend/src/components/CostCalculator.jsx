import React, { useState, useEffect } from 'react';
import { DollarSign, Sliders, Info, ShieldCheck } from 'lucide-react';
import pricingData from './pricing.json'; // local import for bundling

// Fallback pricing if local import has issue in bundling
const PRICING = pricingData || {
  ec2: { "t2.micro": { "hourly": 0.0116 } },
  rds: { "db.t2.micro": { "hourly": 0.017 } },
  s3: { "storage_per_gb": 0.023 },
  cloudfront: { "data_transfer_out_per_gb": 0.085 }
};

export default function CostCalculator({ generatedCosts, freeTierSafe }) {
  // Slider states
  const [ec2Count, setEc2Count] = useState(1);
  const [dbStorage, setDbStorage] = useState(20); // GB
  const [dataTransfer, setDataTransfer] = useState(50); // GB
  const [lambdaRequests, setLambdaRequests] = useState(0.5); // Millions

  // Dynamic calculated costs
  const [costs, setCosts] = useState({
    ec2: 0,
    rds: 0,
    s3: 0,
    cloudfront: 0,
    lambda: 0,
    total: 0
  });

  // Calculate costs when sliders change
  useEffect(() => {
    if (freeTierSafe) {
      setCosts({
        ec2: 0,
        rds: 0,
        s3: 0,
        cloudfront: 0,
        lambda: 0,
        total: 0
      });
      return;
    }

    // Compute costs
    // EC2: t3.micro average hourly rate is ~$0.0104. Let's assume a standard micro instance for calculation
    const ec2Hourly = 0.0116; // t2.micro
    const ec2Monthly = ec2Count * ec2Hourly * 24 * 30;

    // RDS: db.t3.micro average hourly rate ~$0.017
    const rdsMonthly = 0.017 * 24 * 30; // standard RDS instance active

    // S3 Storage (Assume base database storage + backups)
    const s3Monthly = dbStorage * 0.023;

    // CloudFront Bandwidth (Data transfer out)
    // CloudFront free tier is 1TB (1000GB). Anything over is $0.085/GB
    const cfMonthly = Math.max(0, dataTransfer - 1000) * 0.085;

    // Lambda: First 1M requests are free, then $0.20/Million
    // Let's assume average duration is 500ms at 512MB memory ($0.0000083 per sec)
    const lambdaRequestsMonthly = Math.max(0, lambdaRequests - 1.0) * 0.20;
    const gbSecs = lambdaRequests * 1000000 * 0.5 * 0.5; // (Executions * Avg Duration * 512MB RAM in GB)
    const lambdaComputeMonthly = Math.max(0, gbSecs - 400000) * 0.0000166667;
    const lambdaMonthly = lambdaRequestsMonthly + lambdaComputeMonthly;

    const total = ec2Monthly + rdsMonthly + s3Monthly + cfMonthly + lambdaMonthly;

    setCosts({
      ec2: parseFloat(ec2Monthly.toFixed(2)),
      rds: parseFloat(rdsMonthly.toFixed(2)),
      s3: parseFloat(s3Monthly.toFixed(2)),
      cloudfront: parseFloat(cfMonthly.toFixed(2)),
      lambda: parseFloat(lambdaMonthly.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
  }, [ec2Count, dbStorage, dataTransfer, lambdaRequests, freeTierSafe]);

  const maxCost = Math.max(costs.ec2, costs.rds, costs.s3, costs.cloudfront, costs.lambda, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Parameters Panel */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 md:p-8 border-[var(--border-color)] space-y-6">
        <h3 className="font-bold text-[var(--text-color)] text-lg flex items-center gap-2 mb-2">
          <Sliders className="text-cobaltBlue" size={20} />
          Estimate Dynamic Infrastructure Cost
        </h3>
        <p className="text-[var(--text-muted)] text-sm">
          Simulate scaling your instances and databases to visualize estimated monthly cloud hosting costs.
        </p>

        {freeTierSafe ? (
          <div className="bg-emeraldNeon/10 border border-emeraldNeon/30 rounded-2xl p-6 text-center space-y-3">
            <ShieldCheck className="text-emeraldNeon mx-auto animate-pulse" size={36} />
            <h4 className="text-emeraldNeon font-bold text-lg">AWS Free Tier Restrictions Active</h4>
            <p className="text-[var(--text-color)] text-sm max-w-md mx-auto leading-relaxed">
              When Free Tier Mode is active, resource values are strictly capped at their free limits. All server runtimes, databases, and standard S3 transactions estimate to **$0.00/mo**.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* EC2 Instance Count */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--text-color)]">EC2 Runtimes (Web Servers)</span>
                <span className="text-cobaltBlue font-bold">{ec2Count} Instances</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={ec2Count}
                onChange={(e) => setEc2Count(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer accent-cobaltBlue"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>1 Server</span>
                <span>5 Servers</span>
                <span>10 Servers</span>
              </div>
            </div>

            {/* S3 Storage Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--text-color)]">S3 / Database Storage</span>
                <span className="text-cobaltBlue font-bold">{dbStorage} GB</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={dbStorage}
                onChange={(e) => setDbStorage(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer accent-cobaltBlue"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>20 GB</span>
                <span>250 GB</span>
                <span>500 GB</span>
              </div>
            </div>

            {/* Data Transfer */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--text-color)]">Monthly Web Traffic (CDN)</span>
                <span className="text-cobaltBlue font-bold">{dataTransfer} GB</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={dataTransfer}
                onChange={(e) => setDataTransfer(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer accent-cobaltBlue"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>50 GB</span>
                <span>1000 GB (Free limit)</span>
                <span>2000 GB</span>
              </div>
            </div>

            {/* Lambda requests */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--text-color)]">Serverless Lambda Invocations</span>
                <span className="text-cobaltBlue font-bold">{lambdaRequests}M Executions</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={lambdaRequests}
                onChange={(e) => setLambdaRequests(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer accent-cobaltBlue"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>0.1M Requests</span>
                <span>5.0M Requests</span>
                <span>10.0M Requests</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="glass-panel rounded-2xl p-6 border-[var(--border-color)] flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[var(--card-bg)] to-[var(--card-bg)]/30">
        {/* Cost total view */}
        <div className="space-y-4">
          <h4 className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-wider">Estimated Monthly Budget</h4>
          <div className="flex items-baseline text-[var(--text-color)]">
            <DollarSign className="text-emeraldNeon mr-0.5" size={28} />
            <span className="text-5xl font-extrabold tracking-tight">{costs.total}</span>
            <span className="text-[var(--text-muted)] text-sm ml-2">/ month</span>
          </div>

          {/* SVG Progress charts */}
          <div className="space-y-3 pt-6 border-t border-[var(--border-color)]">
            {/* EC2 Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Compute (EC2)</span>
                <span className="text-[var(--text-color)]">${costs.ec2}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cobaltBlue rounded-full transition-all duration-500" 
                  style={{ width: `${(costs.ec2 / maxCost) * 100}%` }}
                />
              </div>
            </div>

            {/* RDS Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Database (RDS)</span>
                <span className="text-[var(--text-color)]">${costs.rds}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emeraldNeon rounded-full transition-all duration-500" 
                  style={{ width: `${(costs.rds / maxCost) * 100}%` }}
                />
              </div>
            </div>

            {/* S3 Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Storage (S3)</span>
                <span className="text-[var(--text-color)]">${costs.s3}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${(costs.s3 / maxCost) * 100}%` }}
                />
              </div>
            </div>

            {/* CF/Network Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Network / CDN</span>
                <span className="text-[var(--text-color)]">${costs.cloudfront}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(costs.cloudfront / maxCost) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-[var(--border-color)] flex items-start gap-2 text-[10px] text-[var(--text-muted)]">
          <Info size={14} className="text-cobaltBlue flex-shrink-0 mt-0.5" />
          <span>
            Costs are estimates based on standard AWS pricing models. Real bills vary depending on traffic usage, regional rates, and transaction spikes.
          </span>
        </div>
      </div>
    </div>
  );
}
