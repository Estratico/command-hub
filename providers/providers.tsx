import React, { ReactNode } from "react";
import SyncProvider from "./syncProvider";

type Props = {
  children: ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <>
      <SyncProvider>{children}</SyncProvider>
    </>
  );
}
