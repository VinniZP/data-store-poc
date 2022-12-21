import { remoteDataLoader, RemoteDataPublic, withRemoteData } from './remote';
import { SortPublic, withSortProps } from './sort';
import { fakeAsync, tick } from '@angular/core/testing';
import { createDataSource, StoreDataSource } from 'data-source';
import { delay, map, Observable, of } from 'rxjs';

interface TestEntity {
  id: number;
  name: string;
  age: number;
}
describe('withRemoteData', function () {
  let ds: StoreDataSource<TestEntity> & RemoteDataPublic<TestEntity>;
  beforeEach(function () {
    ds = createDataSource(
      {
        name: 'test',
        data: [] as TestEntity[],
      },
      withRemoteData()
    );
  });

  it('should set default loading', fakeAsync(function () {
    ds.loadingState$.subscribe((loading) => {
      expect(loading).toEqual('init');
    });
    tick();
  }));

  it('should set loading', fakeAsync(function () {
    ds.setLoadingState('loaded');
    ds.loadingState$.subscribe((loading) => {
      expect(loading).toEqual('loaded');
    });
    tick();
  }));
});

describe('remoteDataLoader', function () {
  let ds: StoreDataSource<TestEntity> & SortPublic<'a'> & RemoteDataPublic<any>;

  const mockedData = [
    { id: 1, name: 'a', age: 15 },
    { id: 2, name: 'b', age: 3 },
    { id: 3, name: 'c', age: 33 },
  ];

  function load(
    params: Record<string, string>
  ): Observable<{ data: TestEntity[] }> {
    return of({
      data: mockedData,
    }).pipe(delay(500));
  }

  beforeEach(function () {
    ds = createDataSource(
      {
        name: 'test',
        data: [] as TestEntity[],
      },
      withSortProps<'a'>({ sort: { key: 'a', direction: 'asc' } }),
      withRemoteData()
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('with request query stream', function () {
    function sortParamsPlugin(
      store: StoreDataSource<any> & SortPublic
    ): Observable<{ sort?: string }> {
      return store.sort$.pipe(
        map((sort) => {
          return {
            sort: sort
              ? `${sort.direction === 'asc' ? '' : '-'}${sort.key}`
              : undefined,
          };
        })
      );
    }

    it('should pass params to query stream', fakeAsync(function () {
      const spySetLoading = jest.spyOn(ds, 'setLoadingState');
      const spySetData = jest.spyOn(ds, 'setData');
      const jestLoad = jest.fn(load);
      jestLoad.mockReturnValue(of({ data: mockedData }).pipe(delay(500)));
      remoteDataLoader(ds, {
        requestQueryStreams: [sortParamsPlugin(ds)],
        load: jestLoad,
        responseParsers: [(response) => response.data],
      }).subscribe();
      tick(200);
      ds.setSort({ key: 'a', direction: 'desc' });
      tick(900);

      expect(jestLoad).toBeCalledTimes(2);
      expect(jestLoad).toBeCalledWith({ sort: 'a' });
      expect(jestLoad).toBeCalledWith({ sort: '-a' });

      expect(spySetLoading).toBeCalledTimes(4);
      expect(spySetLoading).toBeCalledWith('loading');
      expect(spySetLoading).toBeCalledWith('loaded');
      expect(spySetLoading).toBeCalledWith('loading');
      expect(spySetLoading).toBeCalledWith('loaded');

      expect(spySetData).toBeCalledTimes(1);
      expect(spySetData).toBeCalledWith(mockedData);
    }));
  });
});
