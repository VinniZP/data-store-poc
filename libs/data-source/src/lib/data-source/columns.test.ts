import { fakeAsync, tick } from '@angular/core/testing';
import {
  ColumnTogglePublic,
  DataWithId,
  StoreDataSource,
  withColumnToggle,
  createDataSource,
} from 'data-source';

type Columns = 'position' | 'name' | 'weight' | 'symbol';
describe('withColumnToggle', function () {
  let ds: StoreDataSource<DataWithId> & ColumnTogglePublic<Columns>;

  beforeEach(function () {
    ds = createDataSource(
      {
        name: 'test',
      },
      withColumnToggle<Columns>({
        columns: ['position', 'name', 'weight', 'symbol'],
      })
    );
  });

  it('should set default columns', fakeAsync(function () {
    ds.visibleColumns$.subscribe((columns) => {
      expect(columns).toEqual(['position', 'name', 'weight', 'symbol']);
    });
    tick();
  }));

  it('should toggle position column', fakeAsync(function () {
    ds.toggleColumn('position');
    ds.columns$.subscribe((columns) => {
      expect(columns).toEqual(['position', 'name', 'weight', 'symbol']);
    });
    ds.visibleColumns$.subscribe((columns) => {
      expect(columns).toEqual(['name', 'weight', 'symbol']);
    });
    tick();
  }));
});
