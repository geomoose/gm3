/**
 * Small shim over uuid generation that uses crypto.randomUUID()
 */

export const uuid = () => {
  // This has been broadly supported in the browser since 2021
  return crypto.randomUUID();
};
