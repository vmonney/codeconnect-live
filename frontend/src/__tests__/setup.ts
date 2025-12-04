import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// API Base URL
const API_BASE = 'http://localhost:8000/api';

// Mock handlers for API endpoints
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'interviewer',
          avatar: null,
          created_at: new Date().toISOString(),
        },
      });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API_BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      name: string;
      role: string;
    };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { detail: 'Account with this email already exists' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        access_token: 'mock-jwt-token-new',
        token_type: 'bearer',
        user: {
          id: 'user-new',
          email: body.email,
          name: body.name,
          role: body.role,
          avatar: null,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader === 'Bearer mock-jwt-token') {
      return HttpResponse.json({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'interviewer',
        avatar: null,
        created_at: new Date().toISOString(),
      });
    }

    return HttpResponse.json({ detail: 'Invalid token' }, { status: 401 });
  }),

  // Interview endpoints
  http.get(`${API_BASE}/interviews`, () => {
    return HttpResponse.json([
      {
        id: 'interview-1',
        title: 'Test Interview',
        description: 'A test interview',
        interviewer_id: 'user-1',
        interviewer_name: 'Test User',
        candidate_id: null,
        candidate_name: null,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        started_at: null,
        ended_at: null,
        duration: null,
        language: 'javascript',
        template_id: null,
        code: '// code here',
        rating: null,
        notes: null,
        share_link: '/interview/interview-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  http.get(`${API_BASE}/interviews/:id`, ({ params }) => {
    const { id } = params;

    if (id === 'not-found') {
      return HttpResponse.json({ detail: 'Interview not found' }, { status: 404 });
    }

    return HttpResponse.json({
      id,
      title: 'Test Interview',
      description: 'A test interview',
      interviewer_id: 'user-1',
      interviewer_name: 'Test User',
      candidate_id: null,
      candidate_name: null,
      status: 'scheduled',
      scheduled_at: new Date().toISOString(),
      started_at: null,
      ended_at: null,
      duration: null,
      language: 'javascript',
      template_id: null,
      code: '// code here',
      rating: null,
      notes: null,
      share_link: `/interview/${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE}/interviews`, async ({ request }) => {
    const body = (await request.json()) as { title: string; language: string };

    return HttpResponse.json(
      {
        id: 'new-interview',
        title: body.title,
        description: null,
        interviewer_id: 'user-1',
        interviewer_name: 'Test User',
        candidate_id: null,
        candidate_name: null,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        started_at: null,
        ended_at: null,
        duration: null,
        language: body.language,
        template_id: null,
        code: '// starter code',
        rating: null,
        notes: null,
        share_link: '/interview/new-interview',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/interviews/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id,
      title: (updates.title as string) ?? 'Test Interview',
      description: (updates.description as string) ?? null,
      interviewer_id: 'user-1',
      interviewer_name: 'Test User',
      candidate_id: (updates.candidate_id as string) ?? null,
      candidate_name: (updates.candidate_name as string) ?? null,
      status: (updates.status as string) ?? 'scheduled',
      scheduled_at: new Date().toISOString(),
      started_at: (updates.started_at as string) ?? null,
      ended_at: (updates.ended_at as string) ?? null,
      duration: (updates.duration as number) ?? null,
      language: (updates.language as string) ?? 'javascript',
      template_id: null,
      code: (updates.code as string) ?? '// code here',
      rating: (updates.rating as number) ?? null,
      notes: (updates.notes as string) ?? null,
      share_link: `/interview/${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/interviews/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Code execution
  http.post(`${API_BASE}/code/execute`, async ({ request }) => {
    const body = (await request.json()) as { code: string; language: string };

    return HttpResponse.json({
      output: 'Hello, World!',
      error: null,
      execution_time: 150,
    });
  }),

  // Templates
  http.get(`${API_BASE}/templates`, () => {
    return HttpResponse.json([
      {
        id: 'template-1',
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        problem: 'Given an array...',
        examples: 'Example 1...',
        constraints: '2 <= nums.length',
        difficulty: 'easy',
        tags: ['Array', 'Hash Table'],
        starter_code: { javascript: 'function twoSum() {}' },
        solution: null,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  // User profile
  http.patch(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as { name?: string; avatar?: string };

    return HttpResponse.json({
      id,
      email: 'test@example.com',
      name: updates.name ?? 'Test User',
      role: 'interviewer',
      avatar: updates.avatar ?? null,
      created_at: new Date().toISOString(),
    });
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  // Clear localStorage
  localStorage.clear();
});

// Close server after all tests
afterAll(() => server.close());
