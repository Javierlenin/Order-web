declare module "*.svg?react" {
  import type { FC, SVGProps } from "react";

  export const ReactComponent: FC<
    SVGProps<SVGSVGElement> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;
}
