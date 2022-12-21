import { SortPublic, withLocalSort, withSortProps } from './sort';
import { fakeAsync, tick } from '@angular/core/testing';
import { DataWithId, TableDataSource, withDataSource } from 'data-source';
import { of, take } from 'rxjs';

interface TestEntity {
  id: number;
  name: string;
  age: number;
}
describe('withSortProps', function () {
  let ds: TableDataSource<TestEntity> & SortPublic<PropertyKey>;
  beforeEach(function () {
    ds = withDataSource(
      {
        name: 'test',
        data: [
          { id: 1, name: 'a', age: 1 },
          { id: 2, name: 'b', age: 2 },
          { id: 3, name: 'c', age: 3 },
        ],
      },
      withSortProps<keyof TestEntity>({ sort: { key: 'id', direction: 'asc' } })
    );
  });

  it('should set default sort', fakeAsync(function () {
    ds.sort$.pipe(take(1)).subscribe((sort) => {
      expect(sort).toEqual({ key: 'id', direction: 'asc' });
    });
    tick();
  }));

  it('should set sort by name desc', fakeAsync(function () {
    ds.setSort({ key: 'name', direction: 'desc' });
    ds.sort$.pipe(take(1)).subscribe((sort) => {
      expect(sort).toEqual({ key: 'name', direction: 'desc' });
    });
    tick();
  }));
});

describe('withLocalSort', function () {
  let ds: TableDataSource<TestEntity> & SortPublic<PropertyKey>;
  beforeEach(function () {
    ds = withDataSource(
      {
        name: 'test',
        data: [
          { id: 1, name: 'a', age: 15 },
          { id: 2, name: 'b', age: 3 },
          { id: 3, name: 'c', age: 33 },
        ],
      },
      withSortProps<keyof TestEntity>(),
      withLocalSort<keyof TestEntity>({
        id: (a, b, direction) =>
          direction === 'asc' ? a.id - b.id : b.id - a.id,
        name: (a, b, direction) =>
          direction === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        age: (a, b, direction) =>
          direction === 'asc' ? a.age - b.age : b.age - a.age,
      })
    );
  });

  it('should sort by name desc', fakeAsync(function () {
    ds.setSort({ key: 'name', direction: 'desc' });
    ds.connect({ viewChange: of({ start: 0, end: 10 }) })
      .pipe(take(1))
      .subscribe((data) => {
        expect(data.map((value) => value.id)).toEqual([3, 2, 1]);
      });
    tick();
  }));

  it('should sort by age asc', fakeAsync(function () {
    ds.setSort({ key: 'age', direction: 'asc' });
    ds.connect({ viewChange: of({ start: 0, end: 10 }) })
      .pipe(take(1))
      .subscribe((data) => {
        expect(data.map((value) => value.id)).toEqual([2, 1, 3]);
      });
    tick();
  }));
});
