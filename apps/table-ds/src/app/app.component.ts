import { Component, OnInit } from '@angular/core';
import {
  ColumnTogglePublic,
  StoreDataSource,
  withColumnToggle,
  createDataSource,
  withFiltersProps,
  withLocalFilters,
} from 'data-source';

export interface PeriodicElement {
  id: number;
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

interface PeriodicFilters {
  q: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { id: 1, position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { id: 2, position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { id: 3, position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { id: 4, position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { id: 5, position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { id: 6, position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { id: 7, position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { id: 8, position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { id: 9, position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { id: 10, position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

type Columns = 'position' | 'name' | 'weight' | 'symbol';

@Component({
  selector: 'table-ds-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource!: StoreDataSource<PeriodicElement> & ColumnTogglePublic<Columns>;

  ngOnInit(): void {
    const ds = createDataSource(
      {
        data: ELEMENT_DATA,
        name: 'periodicTable',
      },
      withColumnToggle<Columns>({
        columns: ['position', 'name', 'weight', 'symbol'],
      }),
      withFiltersProps<PeriodicFilters>(),
      withLocalFilters<PeriodicFilters, PeriodicElement>({
        position: (value, entity) => !value || entity.position === value,
        symbol: (value, entity) => !value || entity.symbol === value,
        weight: (value, entity) => !value || entity.weight === value,
        q: (value, entity) =>
          !value ||
          [entity.name, entity.position, entity.weight, entity.symbol]
            .join(' ')
            .toLowerCase()
            .includes(value.toLowerCase()),
      })
    );
    ds.columns$.subscribe((v: Columns[]) => {
      console.log('columns', v);
    });
    ds.filters$.subscribe((v: Partial<PeriodicFilters> | undefined) => {
      console.log('filters', v);
    });
    ds.setFilters({
      q: '12',
    });
    this.dataSource = ds;
  }
}
