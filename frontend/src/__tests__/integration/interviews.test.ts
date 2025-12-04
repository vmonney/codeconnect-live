import { describe, it, expect, beforeEach } from 'vitest';
import { useInterviewStore } from '@/stores/interviewStore';
import { setToken, clearToken } from '@/api/httpClient';

describe('Interview Store Integration', () => {
  beforeEach(() => {
    // Reset store state
    useInterviewStore.setState({
      interviews: [],
      currentInterview: null,
      invitations: [],
      chatMessages: [],
      participants: [],
      isTyping: {},
      isLoading: false,
      error: null,
      wsConnection: null,
    });

    // Set auth token for API calls
    setToken('mock-jwt-token');
  });

  describe('fetchInterviews', () => {
    it('should fetch interviews from API', async () => {
      const { fetchInterviews } = useInterviewStore.getState();

      await fetchInterviews();

      const state = useInterviewStore.getState();
      expect(state.interviews).toHaveLength(1);
      expect(state.interviews[0].title).toBe('Test Interview');
      expect(state.interviews[0].interviewerId).toBe('user-1');
      expect(state.interviews[0].language).toBe('javascript');
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during fetch', async () => {
      const { fetchInterviews } = useInterviewStore.getState();

      expect(useInterviewStore.getState().isLoading).toBe(false);

      const fetchPromise = fetchInterviews();
      expect(useInterviewStore.getState().isLoading).toBe(true);

      await fetchPromise;
      expect(useInterviewStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchInterview', () => {
    it('should fetch a single interview by ID', async () => {
      const { fetchInterview } = useInterviewStore.getState();

      const interview = await fetchInterview('interview-123');

      expect(interview).not.toBeNull();
      expect(interview?.id).toBe('interview-123');
      expect(interview?.title).toBe('Test Interview');

      // Should also update currentInterview
      const state = useInterviewStore.getState();
      expect(state.currentInterview?.id).toBe('interview-123');
    });

    it('should return null for non-existent interview', async () => {
      const { fetchInterview } = useInterviewStore.getState();

      const interview = await fetchInterview('not-found');

      expect(interview).toBeNull();
    });

    it('should add interview to list if not exists', async () => {
      const { fetchInterview } = useInterviewStore.getState();

      expect(useInterviewStore.getState().interviews).toHaveLength(0);

      await fetchInterview('interview-new');

      expect(useInterviewStore.getState().interviews).toHaveLength(1);
      expect(useInterviewStore.getState().interviews[0].id).toBe('interview-new');
    });
  });

  describe('createInterview', () => {
    it('should create a new interview', async () => {
      const { createInterview } = useInterviewStore.getState();

      const interview = await createInterview(
        'New Interview',
        'python',
        'user-1',
        'Test User'
      );

      expect(interview).not.toBeNull();
      expect(interview?.id).toBe('new-interview');
      expect(interview?.title).toBe('New Interview');
      expect(interview?.language).toBe('python');

      // Should be added to interviews list
      const state = useInterviewStore.getState();
      expect(state.interviews).toHaveLength(1);
      expect(state.interviews[0].id).toBe('new-interview');
    });
  });

  describe('updateInterview', () => {
    it('should update an existing interview', async () => {
      const { fetchInterview, updateInterview } = useInterviewStore.getState();

      // First fetch an interview
      await fetchInterview('interview-1');

      // Update it
      const result = await updateInterview('interview-1', {
        title: 'Updated Title',
        status: 'in-progress',
      });

      expect(result.success).toBe(true);

      const state = useInterviewStore.getState();
      expect(state.currentInterview?.title).toBe('Updated Title');
      expect(state.currentInterview?.status).toBe('in-progress');
    });
  });

  describe('deleteInterview', () => {
    it('should delete an interview', async () => {
      const { fetchInterview, deleteInterview } = useInterviewStore.getState();

      // First fetch an interview
      await fetchInterview('interview-to-delete');
      expect(useInterviewStore.getState().interviews).toHaveLength(1);

      // Delete it
      const result = await deleteInterview('interview-to-delete');

      expect(result.success).toBe(true);
      expect(useInterviewStore.getState().interviews).toHaveLength(0);
    });

    it('should clear currentInterview if deleted', async () => {
      const { fetchInterview, deleteInterview } = useInterviewStore.getState();

      await fetchInterview('interview-current');
      expect(useInterviewStore.getState().currentInterview).not.toBeNull();

      await deleteInterview('interview-current');
      expect(useInterviewStore.getState().currentInterview).toBeNull();
    });
  });

  describe('executeCode', () => {
    it('should execute code and return result', async () => {
      const { executeCode } = useInterviewStore.getState();

      const result = await executeCode('console.log("Hello")', 'javascript');

      expect(result.output).toBe('Hello, World!');
      expect(result.error).toBeUndefined();
      expect(result.executionTime).toBe(150);
    });
  });

  describe('local state helpers', () => {
    it('getInterviewById should find interview by ID', async () => {
      const { fetchInterviews, getInterviewById } = useInterviewStore.getState();

      await fetchInterviews();

      const interview = getInterviewById('interview-1');
      expect(interview).not.toBeUndefined();
      expect(interview?.title).toBe('Test Interview');
    });

    it('getInterviewsByUser should filter by interviewer', async () => {
      const { fetchInterviews, getInterviewsByUser } = useInterviewStore.getState();

      await fetchInterviews();

      const interviews = getInterviewsByUser('user-1', 'interviewer');
      expect(interviews).toHaveLength(1);

      const noInterviews = getInterviewsByUser('other-user', 'interviewer');
      expect(noInterviews).toHaveLength(0);
    });

    it('setCurrentInterview should update currentInterview', () => {
      const { setCurrentInterview } = useInterviewStore.getState();

      const mockInterview = {
        id: 'mock-1',
        title: 'Mock Interview',
        interviewerId: 'user-1',
        interviewerName: 'Test',
        status: 'scheduled' as const,
        language: 'javascript' as const,
        code: '',
        shareLink: '/interview/mock-1',
      };

      setCurrentInterview(mockInterview);

      expect(useInterviewStore.getState().currentInterview).toEqual(mockInterview);
    });
  });

  describe('legacy local actions', () => {
    it('updateCode should update current interview code', async () => {
      const { fetchInterview, updateCode } = useInterviewStore.getState();

      await fetchInterview('interview-1');

      updateCode('interview-1', 'const x = 1;');

      const state = useInterviewStore.getState();
      expect(state.currentInterview?.code).toBe('const x = 1;');
    });

    it('joinInterview should add participant with cursor color', () => {
      const { joinInterview } = useInterviewStore.getState();

      joinInterview('interview-1', {
        id: 'participant-1',
        name: 'Alice',
        role: 'interviewer',
        isOnline: true,
        cursorColor: '',
      });

      const state = useInterviewStore.getState();
      expect(state.participants).toHaveLength(1);
      expect(state.participants[0].cursorColor).not.toBe('');
    });

    it('leaveInterview should remove participant', () => {
      const { joinInterview, leaveInterview } = useInterviewStore.getState();

      joinInterview('interview-1', {
        id: 'participant-1',
        name: 'Alice',
        role: 'interviewer',
        isOnline: true,
        cursorColor: '',
      });

      leaveInterview('interview-1', 'participant-1');

      expect(useInterviewStore.getState().participants).toHaveLength(0);
    });
  });
});
