

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, ...args: any[]) {
  const prefix = `[${level.toUpperCase()}]`;
  if (typeof console[level] === "function") {
    // @ts-ignore
    console[level](prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

export const logger = {
  debug: (...args: any[]) => log("debug", ...args),
  info: (...args: any[]) => log("info", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  error: (...args: any[]) => log("error", ...args),
};