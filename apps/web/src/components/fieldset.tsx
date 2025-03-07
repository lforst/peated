import { ReactNode } from "react";
import Spinner from "./spinner";

export default ({
  children,
  loading,
}: {
  loading?: boolean;
  children: ReactNode;
}) => {
  return (
    <div className="space-y relative sm:space-y-2">
      {loading && (
        <div className="cursor-disabled absolute inset-0 z-10 bg-slate-700 opacity-50">
          <Spinner />
        </div>
      )}
      {children}
    </div>
  );
};
