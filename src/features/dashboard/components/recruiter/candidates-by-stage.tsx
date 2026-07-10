'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CandidateStage {
  stage: string;
  count: number;
}

interface CandidatesByStageProps {
  candidates: CandidateStage[];
}

const stageColors: Record<string, string> = {
  APPLIED: '#3b82f6',
  INTERVIEWING: '#a855f7',
  OFFERS: '#10b981',
  ACCEPTED: '#059669',
};

const stageLabels: Record<string, string> = {
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFERS: 'Offers',
  ACCEPTED: 'Accepted',
};

export function CandidatesByStage({ candidates }: CandidatesByStageProps) {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">No candidate data available</p>
      </div>
    );
  }

  const stagesData = candidates.map((stage) => ({
    ...stage,
    label: stageLabels[stage.stage] || stage.stage,
    fill: stageColors[stage.stage] || '#6b7280',
  }));

  return (
    <motion.div
      className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Candidate Pipeline
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={stagesData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          >
            {stagesData.map((stage, idx) => (
              <Bar
                key={idx}
                dataKey="count"
                fill={stageColors[stage.stage] || '#6b7280'}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-neutral-200">
        {stagesData.map((stage) => (
          <div key={stage.stage} className="text-center">
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: stageColors[stage.stage] || '#6b7280' }}
            >
              {stage.count}
            </div>
            <p className="text-xs text-neutral-600">{stageLabels[stage.stage]}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
