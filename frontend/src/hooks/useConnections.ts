import { useState, useEffect, useCallback } from 'react';
import { integrationsService } from '@/services/integrationsService';
import type { OAuthConnection, TokenManualInput, DriveSyncResult } from '@/types/integration.types';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiError;
  return e?.response?.data?.detail || e?.message || fallback;
};

export const useConnections = () => {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<DriveSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await integrationsService.listConnections();
      setConnections(list);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to load integration connections.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const submitManualToken = async (payload: TokenManualInput) => {
    try {
      setError(null);
      await integrationsService.connectManualToken(payload);
      await fetchConnections();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, `Failed to connect ${payload.provider} token.`);
      throw new Error(msg);
    }
  };

  const triggerDriveSync = async (): Promise<DriveSyncResult> => {
    try {
      setIsSyncingDrive(true);
      setError(null);
      const result = await integrationsService.triggerDriveSync();
      setSyncResult(result);
      return result;
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Drive sync failed. Make sure Google Drive is connected.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const isConnected = (providerId: string): boolean => {
    return connections.some((c) => c.provider === providerId);
  };

  const getConnection = (providerId: string): OAuthConnection | undefined => {
    return connections.find((c) => c.provider === providerId);
  };

  const disconnectConnection = async (providerId: string) => {
    try {
      setError(null);
      await integrationsService.disconnectConnection(providerId);
      await fetchConnections();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, `Failed to disconnect ${providerId}.`);
      throw new Error(msg);
    }
  };

  return {
    connections,
    isLoading,
    isSyncingDrive,
    syncResult,
    error,
    refreshConnections: fetchConnections,
    submitManualToken,
    triggerDriveSync,
    isConnected,
    getConnection,
    disconnectConnection,
  };
};