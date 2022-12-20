import { DataSourcePlugin, DataStore, DataWithId } from './data-source';
import { PropsFactory, Store, select, withProps } from '@ngneat/elf';
import { Observable, combineLatest, map } from 'rxjs';

export interface FilterProps<Filters> {
  filters: Partial<Filters>;
  initialFilters: Partial<Filters>;
}

export interface FilterPublic<Filters = string> {
  filters$: Observable<Partial<Filters> | undefined>;
  initialFilters$: Observable<Partial<Filters> | undefined>;
  resetFiltersToInitial(): void;

  setFilters(filters: Partial<Filters>): void;
}

export function withFiltersProps<
  Filters extends object,
  EntityType extends DataWithId = any
>(config?: {
  filters?: FilterProps<Filters>['filters'];
  initialFilters?: FilterProps<Filters>['initialFilters'];
}): DataSourcePlugin<FilterProps<Filters>, FilterPublic<Filters>, EntityType> {
  return {
    init(): PropsFactory<FilterProps<Filters>, any> {
      return withProps<FilterProps<Filters>>({
        filters: (config?.filters || config?.initialFilters) ?? {},
        initialFilters: config?.initialFilters ?? {},
      });
    },
    initPublic(
      store: Store<{
        name: any;
        state: DataStore<EntityType> & FilterProps<Filters>;
        config: any;
      }>
    ): FilterPublic<Filters> {
      return {
        filters$: store.pipe(select((state) => state.filters)),
        initialFilters$: store.pipe(select((state) => state.initialFilters)),
        resetFiltersToInitial() {
          store.update((state) => ({
            ...state,
            filters: state.initialFilters,
          }));
        },
        setFilters(filters: Partial<Filters>) {
          store.update((state) => ({
            ...state,
            filters: state.filters ? { ...state.filters, ...filters } : filters,
          }));
        },
      };
    },
  };
}

export function withLocalFilters<
  Filters extends object,
  EntityType extends DataWithId = any
>(filterMethods: {
  [k in keyof Filters]: (
    value: Filters[k] | undefined,
    entity: EntityType
  ) => boolean;
}): DataSourcePlugin<FilterProps<Filters>, undefined, EntityType> {
  return {
    decorators: {
      connect: (method, store) => {
        return function (collectionViewer) {
          return combineLatest([
            method(collectionViewer),
            store.pipe(select((state) => state.filters)),
          ]).pipe(
            map(([entities, filters]) => {
              if (!filters) {
                return entities;
              }
              return entities.filter((entity) => {
                for (const key in filterMethods) {
                  const filter = filterMethods[key];
                  if (filter && !filter(filters[key], entity)) {
                    return false;
                  }
                }
                return true;
              });
            })
          );
        };
      },
    },
  };
}
