import { DataSourcePlugin, DataStore, DataWithId } from './data-source';
import { PropsFactory, Store, select, withProps } from '@ngneat/elf';
import { Observable } from 'rxjs';

export interface ColumnToggleProps<Columns = string> {
  columns: Columns[];
  disabledColumns: Columns[];
}

export interface ColumnTogglePublic<Columns = string> {
  columns$: Observable<Columns[]>;
  visibleColumns$: Observable<Columns[]>;
  toggleColumn(col: Columns): void;
}

export function withColumnToggle<
  Columns extends string = string,
  EntityType extends DataWithId = any
>(config: {
  columns: ColumnToggleProps<Columns>['columns'];
  disabledColumns?: ColumnToggleProps<Columns>['disabledColumns'];
}): DataSourcePlugin<
  ColumnToggleProps<Columns>,
  ColumnTogglePublic<Columns>,
  EntityType
> {
  return {
    init(): PropsFactory<ColumnToggleProps<Columns>, any> {
      return withProps<ColumnToggleProps<Columns>>({
        columns: config.columns,
        disabledColumns: config.disabledColumns || [],
      });
    },
    initPublic(
      store: Store<{
        name: any;
        state: DataStore<EntityType> & ColumnToggleProps<Columns>;
        config: any;
      }>
    ): ColumnTogglePublic<Columns> {
      return {
        columns$: store.pipe(select((state) => state.columns)),
        visibleColumns$: store.pipe(
          select((state) =>
            state.columns.filter((col) => !state.disabledColumns.includes(col))
          )
        ),
        toggleColumn(col: Columns) {
          const disabled = new Set(store.getValue().disabledColumns);
          disabled.has(col) ? disabled.delete(col) : disabled.add(col);
          store.update((state) => ({
            ...state,
            disabledColumns: Array.from(disabled),
          }));
        },
      };
    },
  };
}
