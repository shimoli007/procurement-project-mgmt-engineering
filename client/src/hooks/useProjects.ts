import { useState, useEffect, useCallback } from "react";
import type { Project, BomLine, MaterialLine } from "@/types";
import { api } from "@/lib/api";

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: number, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  getBom: (projectId: number) => Promise<BomLine[]>;
  addBomLine: (projectId: number, data: Partial<BomLine>) => Promise<void>;
  updateBomLine: (
    projectId: number,
    lineId: number,
    data: Partial<BomLine>,
  ) => Promise<void>;
  deleteBomLine: (projectId: number, lineId: number) => Promise<void>;
  generateOrders: (projectId: number) => Promise<void>;
  getMaterialList: (projectId: number) => Promise<MaterialLine[]>;
  refetch: () => void;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<Project[]>("/projects")
      .then(setProjects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tick]);

  const createProject = useCallback(
    async (data: Partial<Project>) => {
      await api.post<Project>("/projects", data);
      refetch();
    },
    [refetch],
  );

  const updateProject = useCallback(
    async (id: number, data: Partial<Project>) => {
      await api.patch<Project>(`/projects/${id}`, data);
      refetch();
    },
    [refetch],
  );

  const deleteProject = useCallback(
    async (id: number) => {
      await api.delete(`/projects/${id}`);
      refetch();
    },
    [refetch],
  );

  const getBom = useCallback(async (projectId: number) => {
    return api.get<BomLine[]>(`/projects/${projectId}/bom`);
  }, []);

  const addBomLine = useCallback(
    async (projectId: number, data: Partial<BomLine>) => {
      await api.post<BomLine>(`/projects/${projectId}/bom`, data);
    },
    [],
  );

  const updateBomLine = useCallback(
    async (projectId: number, lineId: number, data: Partial<BomLine>) => {
      await api.patch<BomLine>(`/projects/${projectId}/bom/${lineId}`, data);
    },
    [],
  );

  const deleteBomLine = useCallback(
    async (projectId: number, lineId: number) => {
      await api.delete(`/projects/${projectId}/bom/${lineId}`);
    },
    [],
  );

  const generateOrders = useCallback(async (projectId: number) => {
    await api.post<unknown>(`/projects/${projectId}/generate-orders`);
  }, []);

  const getMaterialList = useCallback(async (projectId: number) => {
    return api.get<MaterialLine[]>(`/projects/${projectId}/materials`);
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getBom,
    addBomLine,
    updateBomLine,
    deleteBomLine,
    generateOrders,
    getMaterialList,
    refetch,
  };
}
