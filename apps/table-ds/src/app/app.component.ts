import { Component, OnInit } from '@angular/core';
import {ColumnTogglePublic, TableDataSource, withDataSource} from 'data-source';
import { withColumnToggle } from 'data-source';

export interface PeriodicElement {
  id: number;
  name: string;
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
  dataSource!: TableDataSource<PeriodicElement> & ColumnTogglePublic<Columns>;

  ngOnInit(): void {
    const ds = withDataSource(
      {
        data: ELEMENT_DATA,
        name: 'periodicTable',
      },
      withColumnToggle<Columns>({ columns: ['position', 'name', 'weight', 'symbol'] })
    );
    ds.columns$.subscribe(v => {
      console.log(v);
    });
    this.dataSource = ds;
  }
}
