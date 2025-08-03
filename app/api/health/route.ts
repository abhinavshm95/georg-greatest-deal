import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      environment: {
        status: 'unknown',
        details: {}
      },
      stripe: {
        status: 'unknown',
        details: {}
      },
      supabase: {
        status: 'unknown',
        details: {}
      }
    }
  };

  try {
    // Check environment variables
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      healthCheck.checks.environment.status = 'unhealthy';
      healthCheck.checks.environment.details = {
        missing: missingEnvVars,
        error: 'Missing required environment variables'
      };
      healthCheck.status = 'unhealthy';
    } else {
      healthCheck.checks.environment.status = 'healthy';
      healthCheck.checks.environment.details = {
        message: 'All required environment variables are set'
      };
    }

    // Check Stripe connectivity
    try {
      const customer = await stripe.customers.list({ limit: 1 });
      healthCheck.checks.stripe.status = 'healthy';
      healthCheck.checks.stripe.details = {
        message: 'Stripe API connection successful',
        apiVersion: '2025-07-30.basil'
      };
    } catch (error) {
      healthCheck.checks.stripe.status = 'unhealthy';
      healthCheck.checks.stripe.details = {
        error: (error as Error).message
      };
      healthCheck.status = 'unhealthy';
    }

    // Check Supabase connectivity
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('products').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      healthCheck.checks.supabase.status = 'healthy';
      healthCheck.checks.supabase.details = {
        message: 'Supabase connection successful',
        url: supabaseUrl
      };
    } catch (error) {
      healthCheck.checks.supabase.status = 'unhealthy';
      healthCheck.checks.supabase.details = {
        error: (error as Error).message
      };
      healthCheck.status = 'unhealthy';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.environment.status = 'unhealthy';
    healthCheck.checks.environment.details = {
      error: 'Health check failed',
      message: (error as Error).message
    };

    return NextResponse.json(healthCheck, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 