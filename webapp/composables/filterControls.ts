export const useListFilters = <
  T extends Record<string, Ref<string | number | null | undefined>>
>(
  filterObject: T
) => {
  const fixedFilters = Object.entries(filterObject)
    // If value is truthy, then the filter value is fixed and cant be changed for this render.
    .filter(([_key, valueRef]) => valueRef.value)
    .map(([key, _valueRef]) => key);

  const fields = filterObject;

  const router = useRouter();
  const route = useRoute();
  Object.entries(fields).map(([key, valueRef]) => {
    watch(valueRef, () => {
      router.replace({
        query: {
          ...route.query,
          [key]: valueRef.value,
        },
      });
    });
  });

  return {
    fields,
    fixedFilters,
    useUiFilterControls(): UiFilterControls {
      return {
        fields,
        fixedFilters,
      };
    },
  };
};

export interface UiFilterControls {
  fields: Record<string, Ref<string | number | null | undefined>>;
  fixedFilters: string[];
}
