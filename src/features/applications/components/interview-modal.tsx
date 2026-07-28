'use client';

import {
  ScheduleInterviewModal,
  type InterviewFormData,
} from '@/features/candidates/components/schedule-interview-modal';

type InterviewModalProps = {
  isOpen: boolean;
  candidateName: string;
  vacancyTitle: string;
  onClose: () => void;
  onSubmit: (data: InterviewFormData) => Promise<void>;
};

export function InterviewModal(props: InterviewModalProps) {
  return <ScheduleInterviewModal {...props} />;
}
