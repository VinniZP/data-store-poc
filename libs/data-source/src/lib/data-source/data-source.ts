import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { PropsFactory, Store, createStore } from '@ngneat/elf';
import {
  selectAllEntities,
  setEntities,
  withEntities,
} from '@ngneat/elf-entities';
import { Observable } from 'rxjs';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
type MergeReturnType<
  State extends any[],
  Key extends PropertyKey
> = UnionToIntersection<ReturnType<State[number][Key]>>;

export interface DataWithId {
  id: PropertyKey;
}
export interface DataSourceConfig<T> {
  name: string;
  data?: T[];
}

export interface TableDataSource<T> extends DataSource<T> {
  setData(data: T[]): void;
}

export interface DataStore<EntityType extends DataWithId> {
  entities: Record<EntityType['id'], EntityType>;
  ids: EntityType['id'][];
}

export interface DataSourcePlugin<
  P,
  Public = any,
  EntityType extends DataWithId = any
> {
  init?(): PropsFactory<P, any> | undefined;

  initPublic?(
    store: Store<{ name: any; state: DataStore<EntityType> & P; config: any }>
  ): Public;

  decorators?: {
    [L in keyof TableDataSource<any>]?: (
      method: TableDataSource<any>[L],
      store: Store<{ name: any; state: DataStore<EntityType> & P; config: any }>
    ) => TableDataSource<any>[L];
  };
}

export function withDataSource<
  T extends DataWithId,
  S extends [...DataSourcePlugin<any, any, T>[]]
>(
  config: DataSourceConfig<T>,
  ...plugins: S
): TableDataSource<T> & MergeReturnType<S, 'initPublic'> {
  const initialize = plugins
    .map((v) => v.init?.())
    .filter((v) => v !== undefined) as PropsFactory<any, any>[];
  const dataStore = createStore(
    { name: config.name },
    withEntities<T>(),
    ...initialize
  );
  const ds = {
    connect(collectionViewer: CollectionViewer): Observable<T[]> {
      return dataStore.pipe(selectAllEntities());
    },
    disconnect(collectionViewer: CollectionViewer) {
      dataStore.destroy();
    },
    setData(data: T[]) {
      dataStore.update(setEntities(data));
    },
  } as unknown as TableDataSource<T> & MergeReturnType<S, 'initPublic'>;
  plugins.forEach((plugin) => {
    if (plugin.initPublic != null) {
      Object.assign(ds, plugin.initPublic(dataStore));
    }
    if (plugin.decorators != null) {
      Object.entries(plugin.decorators).forEach(([key, value]) => {
        (ds as any)[key] = value((ds as any)[key], dataStore);
      });
    }
  });

  if (config.data) {
    ds.setData(config.data);
  }
  return ds;
}
