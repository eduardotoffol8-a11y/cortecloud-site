import type { ReactNode } from "react";
import styles from "./app-scope.module.css";

export default function ObraCivilLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}>{children}</div>;
}
