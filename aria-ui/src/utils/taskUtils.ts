import { Message, Task, Model, GroupedMessages, FileWithBase64, TaskStatus, ModelsResponse } from "@/types";
import { logger } from "@/lib/logger";

/**
 * Base configuration for API requests
 */
const API_CONFIG = {
  baseUrl: "/api/proxy",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials,
};

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
      credentials: API_CONFIG.credentials,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        { event: 'api.request_failed', endpoint, status: response.status, body: errorBody },
        `API request failed: ${response.status} ${response.statusText}`
      );
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    // Handle 304 Not Modified - browser will use cached response
    // The response body is empty, so we can't parse it
    if (response.status === 304) {
      logger.debug({ event: 'api.cache_hit', endpoint }, `Using cached response for ${endpoint}`);
      // Return null to signal that cached data should be used
      // The browser's cache will handle this automatically
      return null;
    }

    // Get response text first, then try to parse as JSON
    const bodyText = await response.text();
    
    // Handle empty responses
    if (!bodyText || bodyText.trim() === '') {
      logger.warn({ event: 'api.empty_response', endpoint }, `Empty response from ${endpoint}`);
      return null;
    }
    
    try {
      return JSON.parse(bodyText);
    } catch (parseError) {
      logger.error(
        { 
          event: 'api.json_parse_failed', 
          endpoint, 
          contentType: response.headers.get('content-type'), 
          bodyPreview: bodyText.substring(0, 200) 
        },
        `Failed to parse JSON response from ${endpoint}`
      );
      throw new Error(`Invalid JSON response from ${endpoint}`);
    }
  } catch (error) {
    logger.error({ event: 'api.request_failed', endpoint }, `Error in API request to ${endpoint}`, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Build query string from parameters
 */
function buildQueryString(
  params: Record<string, string | number | boolean>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetches messages for a specific task
 */
export async function fetchTaskMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<Message[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<Message[]>(
    `/tasks/${taskId}/messages${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches raw messages for a specific task (unprocessed)
 */
export async function fetchTaskRawMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<Message[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<Message[]>(
    `/tasks/${taskId}/messages/raw${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches processed and grouped messages for a specific task (for chat UI)
 */
export async function fetchTaskProcessedMessages(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<GroupedMessages[]> {
  const queryString = options ? buildQueryString(options) : "";
  const result = await apiRequest<GroupedMessages[]>(
    `/tasks/${taskId}/messages/processed${queryString}`,
    { method: "GET" },
  );
  return result || [];
}

/**
 * Fetches a specific task by ID
 */
export async function fetchTaskById(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}`, { method: "GET" });
}

/**
 * Sends a message to start a new task
 */
export async function startTask(data: {
  description: string;
  model: Model;
  files?: FileWithBase64[];
}): Promise<Task | null> {
  return apiRequest<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Guides an existing task with a message
 */
export async function addMessage(
  taskId: string,
  message: string,
): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/**
 * Fetches all tasks with optional pagination and filtering
 */
export async function fetchTasks(options?: {
  page?: number;
  limit?: number;
  status?: string;
  statuses?: string[];
}): Promise<{ tasks: Task[]; total: number; totalPages: number }> {
  const params: Record<string, string | number> = {};
  
  if (options?.page) params.page = options.page;
  if (options?.limit) params.limit = options.limit;
  if (options?.status) params.status = options.status;
  if (options?.statuses && options.statuses.length > 0) {
    params.statuses = options.statuses.join(',');
  }
  
  const queryString = Object.keys(params).length > 0 ? buildQueryString(params) : "";
  const result = await apiRequest<{ tasks: Task[]; total: number; totalPages: number }>(
    `/tasks${queryString}`,
    { method: "GET" }
  );
  return result || { tasks: [], total: 0, totalPages: 0 };
}

/**
 * Fetches task counts for grouped tabs
 */
export async function fetchTaskCounts(): Promise<Record<string, number>> {
  try {
    const allTasksResult = await fetchTasks();
    
    // Define the status groups
    const statusGroups = {
      ALL: Object.values(TaskStatus),
      ACTIVE: [TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.NEEDS_HELP, TaskStatus.NEEDS_REVIEW],
      COMPLETED: [TaskStatus.COMPLETED],
      CANCELLED_FAILED: [TaskStatus.CANCELLED, TaskStatus.FAILED],
    };

    const counts: Record<string, number> = {
      ALL: allTasksResult.total,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED_FAILED: 0,
    };

    // Fetch counts for each group
    const groupPromises = Object.entries(statusGroups).map(async ([groupKey, statuses]) => {
      if (groupKey === 'ALL') {
        return { groupKey, count: allTasksResult.total };
      }
      
      const result = await fetchTasks({ statuses, limit: 1 });
      return { groupKey, count: result.total };
    });

    const groupCounts = await Promise.all(groupPromises);
    groupCounts.forEach(({ groupKey, count }) => {
      counts[groupKey] = count;
    });

    return counts;
  } catch (error) {
    logger.error({ event: 'task_counts.fetch_failed' }, 'Failed to fetch task counts', error instanceof Error ? error : undefined);
    return {
      ALL: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED_FAILED: 0,
    };
  }
}

export async function fetchModels(): Promise<ModelsResponse> {
  const result = await apiRequest<ModelsResponse>("/tasks/models", {
    method: "GET",
  });
  return result || {
    grouped: { google: [], groq: [], openrouter: [], bytez: [] },
    flat: [],
  };
}

/**
 * Takes over control of a task
 */
export async function takeOverTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/takeover`, { method: "POST" });
}

/**
 * Resumes a paused or stopped task
 */
export async function resumeTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/resume`, { method: "POST" });
}

/**
 * Cancels a running task
 */
export async function cancelTask(taskId: string): Promise<Task | null> {
  return apiRequest<Task>(`/tasks/${taskId}/cancel`, { method: "POST" });
}
