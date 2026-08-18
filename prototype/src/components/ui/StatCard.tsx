import React from 'react';
import * as Icons from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Spark({ data, color, w = 88, h = 30 }: { data?: number[], color: string, w?: number, h?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 6) + 3, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: 'block', marginTop: 10 }}>
      <path d={d} fill="none" style={{ stroke: color }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.3} style={{ fill: color }} />
    </svg>
  );
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  sub, 
  tone = 'blue', 
  trend, 
  spark 
}: { 
  icon: keyof typeof Icons, 
  label: string, 
  value: string | number, 
  sub?: React.ReactNode, 
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray', 
  trend?: number, 
  spark?: number[] 
}) {
  const { theme } = useApp();
  const tones = { 
    blue: ['var(--accent-soft)', 'var(--accent-text)'], 
    green: ['var(--success-bg)', 'var(--success)'], 
    amber: ['var(--warning-bg)', 'var(--warning)'], 
    red: ['var(--danger-bg)', 'var(--danger)'], 
    purple: ['var(--purple-bg)', 'var(--purple)'], 
    gray: ['var(--hover)', 'var(--muted)'] 
  };
  const sparkColors = { 
    blue: theme === 'dark' ? '#6c87f0' : '#4560e6', 
    green: '#18a867', 
    amber: '#e08a1e', 
    red: '#e0554a', 
    purple: '#8b5cf6', 
    gray: theme === 'dark' ? '#7d879e' : '#8b96ab' 
  };
  
  const Icon = Icons[icon] as React.ElementType;
  
  return (
    <div className="card kpi hover-3d cursor-default" style={{ padding: 16, background: 'var(--glass)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', transition: 'transform .16s cubic-bezier(.2,.8,.2,1), box-shadow .16s' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-muted">{label}</span>
        <div className="w-[36px] h-[36px] rounded-xl flex items-center justify-center" style={{ background: tones[tone][0], color: tones[tone][1] }}>
          {Icon && <Icon size={18} strokeWidth={1.8} />}
        </div>
      </div>
      <div className="text-[21px] font-extrabold tracking-tight tabular-nums">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="text-[11.5px] text-muted mt-1.5 flex items-center gap-1.5">
          {trend !== undefined ? (
            <span className={trend > 0 ? 'text-[var(--success)] font-semibold flex items-center' : trend < 0 ? 'text-[var(--danger)] font-semibold flex items-center' : 'text-muted font-semibold'}>
              {trend > 0 ? <Icons.TrendingUp size={12} className="mr-0.5"/> : trend < 0 ? <Icons.TrendingDown size={12} className="mr-0.5" /> : null}
              {Math.abs(trend)}%
            </span>
          ) : null}
          {sub}
        </div>
      )}
      {spark && <Spark data={spark} color={sparkColors[tone]} />}
    </div>
  );
}
