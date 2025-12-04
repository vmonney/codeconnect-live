import { create } from 'zustand';
import { CodeTemplate, ProgrammingLanguage, Difficulty } from '@/types';
import { httpClient } from '@/api/httpClient';
import { BackendTemplate, ApiError, TemplateCreateRequest, TemplateUpdateRequest } from '@/api/types';

interface TemplateState {
  templates: CodeTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: (filters?: { difficulty?: Difficulty; search?: string }) => Promise<void>;
  fetchTemplate: (id: string) => Promise<CodeTemplate | null>;
  addTemplate: (template: Omit<CodeTemplate, 'id' | 'createdAt'>) => Promise<CodeTemplate | null>;
  updateTemplate: (id: string, updates: Partial<CodeTemplate>) => Promise<{ success: boolean; error?: string }>;
  deleteTemplate: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTemplateById: (id: string) => CodeTemplate | undefined;
  getTemplatesByUser: (userId: string) => CodeTemplate[];
}

// Transform backend template format to frontend CodeTemplate type
function transformTemplate(backend: BackendTemplate): CodeTemplate {
  return {
    id: backend.id,
    title: backend.title,
    description: backend.description,
    problem: backend.problem,
    examples: backend.examples,
    constraints: backend.constraints,
    difficulty: backend.difficulty,
    tags: backend.tags,
    starterCode: backend.starter_code as Record<ProgrammingLanguage, string>,
    solution: backend.solution as Record<ProgrammingLanguage, string> | undefined,
    createdBy: backend.created_by,
    createdAt: backend.created_at,
  };
}

// Transform frontend CodeTemplate to backend request format
function toBackendRequest(template: Omit<CodeTemplate, 'id' | 'createdAt'>): TemplateCreateRequest {
  return {
    title: template.title,
    description: template.description,
    problem: template.problem,
    examples: template.examples,
    constraints: template.constraints,
    difficulty: template.difficulty,
    tags: template.tags,
    starter_code: template.starterCode,
    solution: template.solution,
  };
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const endpoint = `/templates${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<BackendTemplate[]>(endpoint);
      set({
        templates: response.map(transformTemplate),
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ error: apiError.detail, isLoading: false });
    }
  },

  fetchTemplate: async (id) => {
    try {
      const response = await httpClient.get<BackendTemplate>(`/templates/${id}`);
      const template = transformTemplate(response);

      // Update local cache
      set((state) => {
        const exists = state.templates.some((t) => t.id === id);
        if (exists) {
          return {
            templates: state.templates.map((t) => (t.id === id ? template : t)),
          };
        } else {
          return {
            templates: [...state.templates, template],
          };
        }
      });

      return template;
    } catch {
      return null;
    }
  },

  addTemplate: async (templateData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await httpClient.post<BackendTemplate>(
        '/templates',
        toBackendRequest(templateData)
      );
      const template = transformTemplate(response);

      set((state) => ({
        templates: [...state.templates, template],
        isLoading: false,
      }));

      return template;
    } catch (error) {
      const apiError = error as ApiError;
      set({ error: apiError.detail, isLoading: false });
      return null;
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      const backendUpdates: TemplateUpdateRequest = {};
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.problem !== undefined) backendUpdates.problem = updates.problem;
      if (updates.examples !== undefined) backendUpdates.examples = updates.examples;
      if (updates.constraints !== undefined) backendUpdates.constraints = updates.constraints;
      if (updates.difficulty !== undefined) backendUpdates.difficulty = updates.difficulty;
      if (updates.tags !== undefined) backendUpdates.tags = updates.tags;
      if (updates.starterCode !== undefined) backendUpdates.starter_code = updates.starterCode;
      if (updates.solution !== undefined) backendUpdates.solution = updates.solution;

      const response = await httpClient.patch<BackendTemplate>(`/templates/${id}`, backendUpdates);
      const template = transformTemplate(response);

      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? template : t)),
      }));

      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  deleteTemplate: async (id) => {
    try {
      await httpClient.delete(`/templates/${id}`);

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));

      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  getTemplateById: (id) => {
    return get().templates.find((t) => t.id === id);
  },

  getTemplatesByUser: (userId) => {
    return get().templates.filter((t) => t.createdBy === userId || t.createdBy === 'system');
  },
}));
