import { fakeAsync, tick } from '@angular/core/testing';
import {
  FilterPublic,
  StoreDataSource,
  withDataSource,
  withFiltersProps,
  withLocalFilters,
} from 'data-source';
import { of } from 'rxjs';

interface TestEntity {
  id: number;
  name: string;
  age: number;
}

interface TestFilters {
  name: string;
}

describe('withFiltersProps', function () {
  let ds: StoreDataSource<TestEntity> & FilterPublic<TestFilters>;
  beforeEach(function () {
    ds = withDataSource(
      {
        name: 'test',
        data: [] as TestEntity[],
      },
      withFiltersProps<TestFilters>({
        initialFilters: {
          name: 'a',
        },
      })
    );
  });

  it('should set default filters', fakeAsync(function () {
    ds.filters$.subscribe((filters) => {
      expect(filters).toEqual({ name: 'a' });
    });
    ds.initialFilters$.subscribe((filters) => {
      expect(filters).toEqual({ name: 'a' });
    });
    tick();
  }));

  it('should set filters', fakeAsync(function () {
    ds.setFilters({ name: 'b' });
    ds.filters$.subscribe((filters) => {
      expect(filters).toEqual({ name: 'b' });
    });
    ds.initialFilters$.subscribe((filters) => {
      expect(filters).toEqual({ name: 'a' });
    });
    tick();
  }));
});

describe('withLocalFilters', function () {
  let ds: StoreDataSource<TestEntity> & FilterPublic<TestFilters>;
  beforeEach(function () {
    ds = withDataSource(
      {
        name: 'test',
        data: [
          { id: 1, name: 'a', age: 15 },
          { id: 2, name: 'b', age: 3 },
          { id: 3, name: 'c', age: 33 },
        ] as TestEntity[],
      },
      withFiltersProps<TestFilters>({
        initialFilters: {
          name: 'a',
        },
      }),
      withLocalFilters<TestFilters>({
        name: (value, filters) => value == undefined || value == filters.name,
      })
    );
  });

  it('should filter by name', fakeAsync(function () {
    ds.setFilters({ name: 'b' });
    ds.connect({ viewChange: of({ start: 0, end: 10 }) }).subscribe((data) => {
      expect(data).toEqual([{ id: 2, name: 'b', age: 3 }]);
    });
    tick();
  }));
});
