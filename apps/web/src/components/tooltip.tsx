import { ReactNode, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import classNames from "../lib/classNames";

type Props = {
  title: ReactNode;
  children?: ReactNode;
  origin?: "left" | "right" | "center";
};

export default function Tooltip({ title, children, origin = "right" }: Props) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useOnClickOutside(ref, () => setVisible(false));

  return (
    <div
      className="group relative inline-flex cursor-help"
      onClick={() => {
        setVisible(!visible);
      }}
    >
      {children}
      <span
        className={classNames(
          "w-max-48 absolute  top-6 w-48 scale-0 items-center justify-center rounded bg-slate-700 p-2 text-center text-xs text-slate-400 transition-all group-hover:scale-100 group-focus:scale-100 group-active:scale-100",
          origin === "right" ? "right-0" : "",
          origin === "left" ? "left-0" : "",
          origin === "center" ? "-left-1/2" : "",
          visible ? "scale-100" : "",
        )}
        ref={ref}
      >
        {title}
      </span>
    </div>
  );
}
