import {DataSourcePlugin, DataStore, DataWithId} from './data-source';
import {PropsFactory, select, Store, withProps} from '@ngneat/elf';
import {Observable} from "rxjs";
import {stat} from "ng-packagr/lib/utils/fs";

export interface FilterProps<Filters> {
  filters: Partial<Filters>;
  initialFilters: Partial<Filters>;
}

export interface FilterPublic<Filters=string> {
  filters$: Observable<Partial<Filters> | undefined>;
  initialFilters$: Observable<Partial<Filters> | undefined>;
  resetFiltersToInitial(): void;

  setFilters(filters: Partial<Filters>): void;
}

export function withFilters<Filters extends object, EntityType extends DataWithId = any>(config?: {
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
    initPublic(store: Store<{ name: any; state: DataStore<EntityType> & FilterProps<Filters>; config: any }>): FilterPublic<Filters> {
      return {
        filters$: store.pipe(select(state => state.filters)),
        initialFilters$: store.pipe(select(state => state.initialFilters)),
        resetFiltersToInitial() {
          store.update(state => ({...state, filters: state.initialFilters}));
        },
        setFilters(filters: Partial<Filters>) {
          store.update(state => ({...state, filters: state.filters ? {...state.filters, ...filters} : filters}));
        }
      }
    }
  };
}
