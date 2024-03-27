import type { AsyncDataExecuteOptions } from "nuxt/dist/app/composables/asyncData";

export const usePageControls = () => {
  const currentPage = ref(1);

  return {
    currentPage,
    useUiPageControls(
      loading: Ref<boolean>,
      refresh: (opt?: AsyncDataExecuteOptions) => unknown,
      maxPages: ComputedRef<number>
    ): UiPageControls {
      return {
        currentPage,
        loading,
        maxPages,
        refresh,
        // If current page is 5, allow user to jump back 5 pages.
        hasPrevFivePage: computed(
          () => !loading.value && 5 <= currentPage.value
        ),
        // If current page is 2, allow user to go back 1 page.
        hasPrevPage: computed(() => !loading.value && 2 <= currentPage.value),
        // If current page is 1 less than max, allow user to go forward 1 page.
        hasNextPage: computed(
          () => !loading.value && currentPage.value <= maxPages.value - 1
        ),
        // If current page is 5 less than max, allow user to go forward 5 pages.
        hasNextFivePage: computed(
          () => !loading.value && currentPage.value <= maxPages.value - 5
        ),
        changePage(delta: number) {
          currentPage.value += delta;
        },
      };
    },
  };
};

export interface UiPageControls {
  currentPage: Ref<number>;
  loading: Ref<boolean>;
  refresh: (opt?: AsyncDataExecuteOptions) => unknown;
  maxPages: ComputedRef<number>;
  hasPrevFivePage: ComputedRef<boolean>;
  hasPrevPage: ComputedRef<boolean>;
  hasNextPage: ComputedRef<boolean>;
  hasNextFivePage: ComputedRef<boolean>;
  changePage: (delta: number) => void;
}
