import { useApiQuery, useApiMutation } from './useApi';
import { examService } from '../services';

export const useExams = () => {
  return useApiQuery('exams', () => examService.getExams());
};

export const useExam = (id) => {
  return useApiQuery(['exam', id], () => examService.getExamById(id), {
    enabled: !!id
  });
};

export const useCreateExam = () => {
  return useApiMutation(
    (examData) => examService.createExam(examData),
    {
      successMessage: 'Exam created successfully!',
      invalidateQueries: ['exams']
    }
  );
};

export const useUpdateExam = () => {
  return useApiMutation(
    ({ id, data }) => examService.updateExam(id, data),
    {
      successMessage: 'Exam updated successfully!',
      invalidateQueries: ['exams']
    }
  );
};

export const useDeleteExam = () => {
  return useApiMutation(
    (id) => examService.deleteExam(id),
    {
      successMessage: 'Exam deleted successfully!',
      invalidateQueries: ['exams']
    }
  );
};

export const usePracticeTests = () => {
  return useApiQuery('practice-tests', () => examService.getPracticeTests());
};

export const useSkillAssessments = () => {
  return useApiQuery('skill-assessments', () => examService.getSkillAssessments());
};