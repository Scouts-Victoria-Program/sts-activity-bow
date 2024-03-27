import type { StatData } from "~/server/types/stat";

export const useStat = () => {
  const statsState = useState<StatData | null>("stats", () => null);

  return {
    stats: statsState,
    setStat(stat: StatData): void {
      statsState.value = stat;
    },
    useFetchStats() {
      const { data, pending, refresh, error } = useFetch(`/api/stats`);

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useStat().setStat(value.stats);
      });

      return {
        loading: pending,
        refresh,
        error,
        errorMessage: ref(""),
      };
    },
  };
};
