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

export interface StoreDataSource<T> extends DataSource<T> {
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
    [L in keyof StoreDataSource<any>]?: (
      method: StoreDataSource<any>[L],
      store: Store<{ name: any; state: DataStore<EntityType> & P; config: any }>
    ) => StoreDataSource<any>[L];
  };
}

export function createDataSource<
  T extends DataWithId,
  S extends [...DataSourcePlugin<any, any, T>[]]
>(
  config: DataSourceConfig<T>,
  ...plugins: S
): StoreDataSource<T> & MergeReturnType<S, 'initPublic'> {
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect(collectionViewer: CollectionViewer) {},
    setData(data: T[]) {
      dataStore.update(setEntities(data));
    },
  } as unknown as StoreDataSource<T> & MergeReturnType<S, 'initPublic'>;
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
