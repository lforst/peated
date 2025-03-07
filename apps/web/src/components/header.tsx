import { ReactNode } from "react";
import classNames from "../lib/classNames";

type Props = {
  noMobile?: boolean;
  children?: ReactNode;
};

export default ({ noMobile, children }: Props) => {
  return (
    <header
      className={classNames(
        "header h-14 overflow-hidden sm:h-20",
        noMobile ? "hidden sm:block" : "",
      )}
    >
      <div className="fixed left-0 right-0 z-10">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-3 sm:h-20 sm:px-3 lg:px-0">
          {children}
        </div>
      </div>
    </header>
  );
};
