import { describe, it, expect, beforeEach } from 'vitest';
import { useTemplateStore } from '@/stores/templateStore';
import { setToken, clearToken } from '@/api/httpClient';

describe('Template Store Integration', () => {
  beforeEach(() => {
    // Reset store state
    useTemplateStore.setState({
      templates: [],
      isLoading: false,
      error: null,
    });

    // Set auth token for API calls
    setToken('mock-jwt-token');
  });

  describe('fetchTemplates', () => {
    it('should fetch templates from API', async () => {
      const { fetchTemplates } = useTemplateStore.getState();

      await fetchTemplates();

      const state = useTemplateStore.getState();
      expect(state.templates).toHaveLength(1);
      expect(state.templates[0].title).toBe('Two Sum');
      expect(state.templates[0].difficulty).toBe('easy');
      expect(state.templates[0].tags).toContain('Array');
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during fetch', async () => {
      const { fetchTemplates } = useTemplateStore.getState();

      expect(useTemplateStore.getState().isLoading).toBe(false);

      const fetchPromise = fetchTemplates();
      expect(useTemplateStore.getState().isLoading).toBe(true);

      await fetchPromise;
      expect(useTemplateStore.getState().isLoading).toBe(false);
    });
  });

  describe('local getters', () => {
    it('getTemplateById should find template by ID', async () => {
      const { fetchTemplates, getTemplateById } = useTemplateStore.getState();

      await fetchTemplates();

      const template = getTemplateById('template-1');
      expect(template).not.toBeUndefined();
      expect(template?.title).toBe('Two Sum');
    });

    it('getTemplateById should return undefined for non-existent ID', async () => {
      const { fetchTemplates, getTemplateById } = useTemplateStore.getState();

      await fetchTemplates();

      const template = getTemplateById('non-existent');
      expect(template).toBeUndefined();
    });

    it('getTemplatesByUser should return templates for user or system', async () => {
      const { fetchTemplates, getTemplatesByUser } = useTemplateStore.getState();

      await fetchTemplates();

      // System templates should be returned for any user
      const templates = getTemplatesByUser('any-user-id');
      expect(templates).toHaveLength(1);
      expect(templates[0].createdBy).toBe('system');
    });
  });

  describe('template transformation', () => {
    it('should correctly transform starterCode from snake_case', async () => {
      const { fetchTemplates } = useTemplateStore.getState();

      await fetchTemplates();

      const state = useTemplateStore.getState();
      const template = state.templates[0];

      // starterCode should be transformed from starter_code
      expect(template.starterCode).toBeDefined();
      expect(template.starterCode.javascript).toBe('function twoSum() {}');
    });

    it('should correctly transform createdBy from created_by', async () => {
      const { fetchTemplates } = useTemplateStore.getState();

      await fetchTemplates();

      const state = useTemplateStore.getState();
      const template = state.templates[0];

      expect(template.createdBy).toBe('system');
    });
  });
});
