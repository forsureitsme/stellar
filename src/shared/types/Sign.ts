import type { SignGroup } from "./SignGroup";

export interface Sign {
  loc: string;
  name: string;
  src: string;
  group: SignGroup;
}
