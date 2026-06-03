/**
 * Small shim over uuid generation that uses an internal counter
 * to generate sequential but unique to the session IDs.
 */

// "GeoMoose" in hex. or an attempt
let COUNTER = 0x9e03005e;

export const uuid = () => {
  // crypto.randomUUID was used before but internal sites are frequently
  //  deployed with HTTP. This was preventing IDs from being generated.
  // There are corner cases where this could fail (merging datasets, using _uuid with WFS)
  //  but the security risk of the UUID library was more problematic.
  return `${(++COUNTER).toString(16)}-${Math.floor(Math.random() * 10000).toString(16)}`;
};
