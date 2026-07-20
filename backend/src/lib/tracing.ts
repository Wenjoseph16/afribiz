import { logger } from './logger';

let tracingEnabled = false;

export function initTracing() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    logger.info('OpenTelemetry tracing disabled (no OTEL_EXPORTER_OTLP_ENDPOINT)');
    tracingEnabled = false;
    return;
  }

  try {
    tracingEnabled = true;
    logger.info('OpenTelemetry tracing initialized', { endpoint });
  } catch (err) {
    logger.warn('Failed to initialize OpenTelemetry', { error: err });
    tracingEnabled = false;
  }
}

export function isTracingEnabled(): boolean {
  return tracingEnabled;
}

export async function traceSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  if (!tracingEnabled) return fn();

  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug('trace_span', { name, duration, attributes, success: true });
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logger.debug('trace_span', { name, duration, attributes, success: false, error: err });
    throw err;
  }
}
