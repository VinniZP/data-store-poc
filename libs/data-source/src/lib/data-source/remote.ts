import { SortPublic } from './sort';
import { PropsFactory, select, Store, withProps } from '@ngneat/elf';
import { DataSourcePlugin, DataWithId, StoreDataSource } from 'data-source';
import {
  catchError,
  combineLatest,
  defer,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

export interface RemoteDataProps {
  loadingState: 'init' | 'loading' | 'loaded' | 'error';
}

export interface RemoteDataPublic<EntityType extends DataWithId = any> {
  loadingState$: Observable<RemoteDataProps['loadingState']>;
  setLoadingState(state: RemoteDataProps['loadingState']): void;
}

export function withRemoteData<
  EntityType extends DataWithId = any
>(): DataSourcePlugin<
  RemoteDataProps,
  RemoteDataPublic<EntityType>,
  EntityType
> {
  return {
    init(): PropsFactory<RemoteDataProps, any> {
      return withProps<RemoteDataProps>({
        loadingState: 'init',
      });
    },
    initPublic(store: Store<any>): RemoteDataPublic {
      return {
        loadingState$: store.pipe(select((state) => state.loadingState)),
        setLoadingState(loadingState: RemoteDataProps['loadingState']) {
          store.update((state) => ({
            ...state,
            loadingState: loadingState,
          }));
        },
      };
    },
  };
}

type InferEntityFromStore<T> = T extends StoreDataSource<infer E> ? E : never;
type InferResponseFromObservable<T> = T extends Observable<infer E> ? E : never;

export function remoteDataLoader<
  S extends StoreDataSource<any> & RemoteDataPublic<EntityType>,
  EntityType extends InferEntityFromStore<S>,
  R extends Observable<any>,
  ResponseType extends InferResponseFromObservable<R>
>(
  dataSource: S,
  config: {
    load: (params: { [key: string]: string }) => R;
    requestQueryStreams?: Observable<{ [key: string]: string }>[];
    responseParsers: ((response: ResponseType) => EntityType[] | void)[];
  }
) {
  const { load, requestQueryStreams, responseParsers } = config;
  const requestQuery$ = combineLatest([
    ...(requestQueryStreams ?? [of({})]),
  ]).pipe(
    map((params) => Object.assign({}, ...params)),
    switchMap((params) =>
      load(params).pipe(
        (source: Observable<any>): Observable<any> =>
          defer(() => {
            dataSource.setLoadingState('loading');
            return source.pipe(
              finalize(() => dataSource.setLoadingState('loaded')),
              catchError((error) => {
                dataSource.setLoadingState('error');
                return throwError(error);
              })
            );
          }),
        map((response) => {
          responseParsers.forEach((parser) => {
            const data = parser(response);
            if (data) {
              dataSource.setData(data);
            }
          });
          return response;
        })
      )
    )
  );
  return requestQuery$;
}
