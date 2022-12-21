import { DataSourcePlugin, DataStore, DataWithId } from './data-source';
import { PropsFactory, Store, select, withProps } from '@ngneat/elf';
import { Observable, combineLatest, map } from 'rxjs';

export type SortDirection = 'asc' | 'desc';

export interface SortParam<SortBy extends PropertyKey = any> {
  key: SortBy;
  direction: SortDirection;
}

export interface SortProps<SortBy extends PropertyKey> {
  sort: SortParam<SortBy> | null;
}

export interface SortPublic<SortBy extends PropertyKey = string> {
  sort$: Observable<SortParam<SortBy> | null>;

  setSort(sort: SortParam<SortBy>): void;
}

export function withSortProps<
  SortBy extends PropertyKey,
  EntityType extends DataWithId = any
>(config?: {
  sort: SortProps<SortBy>['sort'];
}): DataSourcePlugin<SortProps<SortBy>, SortPublic<SortBy>, EntityType> {
  return {
    init(): PropsFactory<SortProps<SortBy>, any> {
      return withProps<SortProps<SortBy>>({
        sort: config?.sort ?? null,
      });
    },
    initPublic(
      store: Store<{
        name: any;
        state: DataStore<EntityType> & SortProps<SortBy>;
        config: any;
      }>
    ): SortPublic<SortBy> {
      return {
        sort$: store.pipe(select((state) => state.sort)),
        setSort(sort: SortParam<SortBy>) {
          store.update((state) => ({
            ...state,
            sort: state.sort ? { ...state.sort, ...sort } : sort,
          }));
        },
      };
    },
  };
}

export function withLocalSort<
  SortBy extends PropertyKey,
  EntityType extends DataWithId = any
>(sortMethods: {
  [k in SortBy]: (
    entityA: EntityType,
    entityB: EntityType,
    direction: SortDirection
  ) => number;
}): DataSourcePlugin<SortProps<SortBy>, undefined, EntityType> {
  return {
    decorators: {
      connect: (method, store) => {
        return function (collectionViewer) {
          return combineLatest([
            method(collectionViewer),
            store.pipe(select((state) => state.sort)),
          ]).pipe(
            map(([entities, sort]) => {
              if (!sort) {
                return entities;
              }
              return [...entities].sort((a, b) => {
                const sortFn = sortMethods[sort.key];
                console.log(sortFn(a, b, sort.direction));
                if (sortFn) {
                  return sortFn(a, b, sort.direction);
                }
                return 0;
              });
            })
          );
        };
      },
    },
  };
}
