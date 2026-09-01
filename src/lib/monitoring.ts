/**
 * Monitoring & Error Tracking Module
 * 
 * Provides production-grade error tracking, performance monitoring,
 * and structured logging. Provider-agnostic — wire to Sentry, Datadog,
 * or similar in production via env vars.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  tags?: Record<string, string>;
}

// ─── Monitoring Configuration ───────────────────────────────────────────

interface MonitoringConfig {
  enabled: boolean;
  logLevel: LogLevel;
  remoteEndpoint?: string;
  sampleRate: number; // 0.0 - 1.0
}

function loadConfig(): MonitoringConfig {
  return {
    enabled: import.meta.env.VITE_MONITORING_ENABLED !== 'false',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
    remoteEndpoint: import.meta.env.VITE_MONITORING_ENDPOINT,
    sampleRate: parseFloat(import.meta.env.VITE_MONITORING_SAMPLE_RATE || '1.0'),
  };
}

// ─── Log Level Hierarchy ────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

function shouldLog(level: LogLevel, config: MonitoringConfig): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.logLevel];
}

// ─── Console Transport ──────────────────────────────────────────────────

function consoleTransport(entry: LogEntry): void {
  const prefix = `[${entry.level.toUpperCase()}]`;
  const details = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const errorInfo = entry.error ? `\n${entry.error.stack || entry.error.message}` : '';

  switch (entry.level) {
    case 'debug':
      // eslint-disable-next-line no-console -- log-level router maps debug entries to console.debug by design
      console.debug(prefix, entry.message, details, errorInfo);
      break;
    case 'info':
      // eslint-disable-next-line no-console -- log-level router maps info entries to console.info by design
      console.info(prefix, entry.message, details, errorInfo);
      break;
    case 'warn':
      console.warn(prefix, entry.message, details, errorInfo);
      break;
    case 'error':
    case 'fatal':
      console.error(prefix, entry.message, details, errorInfo);
      break;
  }
}

// ─── Remote Transport (send to remote endpoint) ─────────────────────────

async function remoteTransport(entry: LogEntry, config: MonitoringConfig): Promise<void> {
  if (!config.remoteEndpoint) return;

  // Sample errors at higher rate than info logs
  const sampleRate = entry.level === 'error' || entry.level === 'fatal'
    ? 1.0
    : config.sampleRate;

  if (Math.random() > sampleRate) return;

  try {
    // Use sendBeacon for reliability during page unload
    const payload = JSON.stringify(entry);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(config.remoteEndpoint, payload);
    } else {
      await fetch(config.remoteEndpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch {
    // Silently fail — don't let monitoring itself cause errors
  }
}

// ─── Performance Monitoring ─────────────────────────────────────────────

class PerformanceMonitor {
  private marks = new Map<string, number>();
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    const start = this.marks.get(startMark);
    if (start === undefined) return null;

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (end === undefined) return null;

    const duration = end - start;
    this.record({ name, duration, timestamp: Date.now() });
    return duration;
  }

  record(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log performance warnings
    if (metric.duration > 100) {
      monitor.warn(`Slow operation: ${metric.name}`, {
        duration: `${metric.duration.toFixed(1)}ms`,
        tags: metric.tags,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.marks.clear();
    this.metrics = [];
  }

  /** Report Web Vitals-like metrics */
  reportWebVitals(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        this.record({
          name: entry.name,
          duration: entry.duration,
          timestamp: Date.now(),
        });
      }
    }
  }
}

// ─── Error Tracking ─────────────────────────────────────────────────────

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private readonly maxErrors = 50;

  track(error: Error, componentStack?: string): void {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errors.push(report);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    monitor.error(error.message, {
      error: error,
      componentStack,
      url: report.url,
    });
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

// ─── Main Monitoring Service ────────────────────────────────────────────

class MonitoringService {
  private config: MonitoringConfig;
  readonly perf: PerformanceMonitor;
  readonly errors: ErrorTracker;
  private logBuffer: LogEntry[] = [];
  private readonly maxLogBuffer = 200;

  constructor() {
    this.config = loadConfig();
    this.perf = new PerformanceMonitor();
    this.errors = new ErrorTracker();
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.config.enabled) return;
    if (!shouldLog(level, this.config)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
    };

    // Buffer for potential remote sending
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxLogBuffer) {
      this.logBuffer.shift();
    }

    // Console output
    consoleTransport(entry);

    // Remote sending (fire-and-forget)
    void remoteTransport(entry, this.config);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context, context?.error as Error | undefined);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.log('fatal', message, context, context?.error as Error | undefined);
  }

  /** Capture an unhandled promise rejection */
  captureRejection(reason: unknown): void {
    const message = reason instanceof Error ? reason.message : String(reason);
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.error(`Unhandled Promise Rejection: ${message}`, { error });
  }

  /** Capture a window error event */
  captureWindowError(event: ErrorEvent): void {
    this.error(`Uncaught Exception: ${event.message}`, {
      error: event.error,
      filename: event.filename,
      lineno: event.lineno,
    });
  }

  /** Initialize global error handlers */
  initGlobalHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureRejection(event.reason);
    });

    // Uncaught exceptions
    window.addEventListener('error', (event: ErrorEvent) => {
      this.captureWindowError(event);
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  /** Refresh configuration (e.g., from settings change) */
  refreshConfig(): void {
    this.config = loadConfig();
  }
}

export const monitor = new MonitoringService();

// Auto-initialize global handlers in browser environment
if (typeof window !== 'undefined') {
  monitor.initGlobalHandlers();
}
