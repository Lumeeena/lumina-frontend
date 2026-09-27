// Production Docker stages omit dev dependencies and have no Git checkout.
if (
  !process.env.CI &&
  process.env.NODE_ENV !== "production" &&
  process.env.HUSKY !== "0"
) {
  const { existsSync } = await import("node:fs");
  if (existsSync(".git")) {
    const { default: husky } = await import("husky");
    husky();
  }
}
