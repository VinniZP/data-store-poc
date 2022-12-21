import { fakeAsync, tick } from '@angular/core/testing';
import { select, withProps } from '@ngneat/elf';
import { createDataSource } from 'data-source';
import { of } from 'rxjs';

const collectionViewer = { viewChange: of({ start: 0, end: 10 }) };

it('should create datasource with empty data', fakeAsync(() => {
  const ds = createDataSource({ name: 'test' });

  ds.connect(collectionViewer).subscribe((v) => {
    expect(v).toEqual([]);
  });

  tick(50);
}));

it('should create datasource with data', fakeAsync(() => {
  const ds = createDataSource({ name: 'test', data: [{ id: 1 }] });

  ds.connect(collectionViewer).subscribe((v) => {
    expect(v).toEqual([{ id: 1 }]);
  });

  tick(50);
}));

it('should create datasource with data and plugin', fakeAsync(() => {
  const ds = createDataSource(
    { name: 'test', data: [{ id: 1 }] },
    {
      init() {
        return withProps({ test: 'test' });
      },
      initPublic(store) {
        return {
          test$: store.pipe(select((state) => state.test)),
        };
      },
    }
  );

  ds.connect(collectionViewer).subscribe((v) => {
    expect(v).toEqual([{ id: 1 }]);
  });

  ds.test$.subscribe((v) => {
    expect(v).toEqual('test');
  });

  tick(50);
}));
