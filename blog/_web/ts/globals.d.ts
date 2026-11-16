declare module "*.scss";

// Speculation Rules prerendering; not in TypeScript's DOM types yet.
// Undefined in browsers without prerendering, which is falsy, as wanted.
interface Document {
  readonly prerendering?: boolean;
}
