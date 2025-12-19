import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export const ApiTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test health endpoint
        const health = await api.health.check();
        setHealthStatus(health);
        
        console.log('API Health Check:', health);
        
        // Test RAG endpoint
        try {
          const ragTest = await api.rag.query({
            query: 'What is photosynthesis?',
            subject: 'biology'
          });
          console.log('RAG Test:', ragTest);
        } catch (ragError) {
          console.log('RAG Error (expected in some cases):', ragError);
        }
        
      } catch (err: any) {
        console.error('API Test Error:', err);
        setError(err.message || 'API connection failed');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700">Testing API connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">API Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-green-800 font-semibold mb-2">API Connection Successful!</h3>
      {healthStatus && (
        <div className="text-sm text-green-700">
          <p><strong>Status:</strong> {healthStatus.message}</p>
          <p><strong>Timestamp:</strong> {healthStatus.timestamp}</p>
        </div>
      )}
    </div>
  );
};