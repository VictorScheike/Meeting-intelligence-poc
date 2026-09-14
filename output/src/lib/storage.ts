const PREFIX = "mi-check:";

export function checklistKey(
  title: string,
  personName: string,
  taskText: string,
): string {
  return `${PREFIX}${title}::${personName}::${taskText}`;
}

export function readChecklistItem(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeChecklistItem(key: string, checked: boolean): void {
  try {
    if (checked) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Private browsing or blocked storage should not break the report.
  }
}
