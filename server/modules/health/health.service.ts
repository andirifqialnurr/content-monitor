export function getHealthStatus() {
  return {
    status: "ok",
    service: "content-monitor",
    timestamp: new Date(),
  };
}
