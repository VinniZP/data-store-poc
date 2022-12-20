import { withDataSource } from 'data-source';
import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import {select, withProps} from "@ngneat/elf";

const collectionViewer = { viewChange: of({ start: 0, end: 10 }) };

it('should create datasource with empty data', fakeAsync(() => {
  const ds = withDataSource({ name: 'test' });

  ds.connect(collectionViewer).subscribe((v) => {
    expect(v).toEqual([]);
  });

  tick(50);
}));

it('should create datasource with data', fakeAsync(() => {
  const ds = withDataSource({ name: 'test', data: [{ id: 1 }] });

  ds.connect(collectionViewer).subscribe((v) => {
    expect(v).toEqual([{ id: 1 }]);
  });

  tick(50);
}));

it('should create datasource with data and plugin', fakeAsync(() => {
  const ds = withDataSource(
    { name: 'test', data: [{ id: 1 }] },
    {
      init() {
        return withProps({ test: 'test' });
      },
      initPublic(store) {
        return {
          test$: store.pipe(select((state) => state.test))
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

