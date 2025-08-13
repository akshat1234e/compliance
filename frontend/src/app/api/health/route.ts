/**
 * Health Check API Route
 * Provides health status for the frontend application
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      services: {
        frontend: 'healthy',
        api: await checkApiHealth(),
        database: await checkDatabaseHealth(),
      },
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

async function checkApiHealth(): Promise<string> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return 'unknown';
    }

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    console.error('API health check failed:', error);
    return 'unhealthy';
  }
}

async function checkDatabaseHealth(): Promise<string> {
  try {
    // This would typically check database connectivity
    // For now, we'll return a placeholder
    return 'unknown';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'unhealthy';
  }
}

// Support for HEAD requests (common for load balancers)
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
