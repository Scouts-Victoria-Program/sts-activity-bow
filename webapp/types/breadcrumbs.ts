export interface Breadcrumb {
  to: string;
  label: string;
}

export function useBreadcrumbs(breadcrumbs: Breadcrumb[]) {
  return breadcrumbs;
}
