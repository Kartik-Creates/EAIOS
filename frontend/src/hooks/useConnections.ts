import { useState, useEffect, useCallback } from 'react';
import { integrationsService } from '@/services/integrationsService';
import type { OAuthConnection, TokenManualInput, DriveSyncResult } from '@/types/integration.types';

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
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to load integration connections.';
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
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || `Failed to connect ${payload.provider} token.`;
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
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Drive sync failed. Make sure Google Drive is connected.';
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
  };
};
