/**
 * The platform an Expandable Table runs against, shared by its story and its
 * test, so the test can assert on what the story's component actually does.
 */
import { Text } from '@pega/cosmos-react-core';
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK S-123';
export const ROW_CLASS = 'Data-Computer';

/** Mock detail content rendered in the expanded row. */
export const MockDetailView = ({ rowIndex, viewName }: { rowIndex: number; viewName: string }) => {
  const brands = ['HP EliteBook', 'Lenovo ThinkPad', 'Apple MacBook'];
  const serials = ['S-1001', 'S-2042', 'S-3087'];
  const locations = ['New York', 'London', 'San Francisco'];
  const assignees = ['Alice Johnson', 'Bob Smith', 'Carol Williams'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', padding: '0.5rem 0' }}>
      <Text>
        <strong>View:</strong> {viewName || 'ComputerDetails'}
      </Text>
      <Text>
        <strong>Device:</strong> {brands[rowIndex] ?? ''}
      </Text>
      <Text>
        <strong>Serial number:</strong> {serials[rowIndex] ?? ''}
      </Text>
      <Text>
        <strong>Location:</strong> {locations[rowIndex] ?? ''}
      </Text>
      <Text>
        <strong>Assigned to:</strong> {assignees[rowIndex] ?? ''}
      </Text>
    </div>
  );
};

/** The `.Computers` list, column by column. */
const columns = [
  { label: 'Brand', componentType: 'TextInput', values: ['HP EliteBook', 'Lenovo ThinkPad', 'Apple MacBook'] },
  { label: 'Memory', componentType: 'TextInput', values: ['16 GB', '8 GB', '16 GB'] },
  { label: 'Processor', componentType: 'TextInput', values: ['Intel i7', 'Intel i5', 'Apple M3'] },
  { label: 'Price', componentType: 'Currency', values: [1200.0, 1345.0, 1499.0] },
  { label: 'Status', componentType: 'TextInput', values: ['Available', 'In Use', 'Available'] },
];

/** `caseInfo.content.Computers[2]` -> 2 */
const rowOf = (pageReference: string) => Number(/\[(\d+)\]$/.exec(pageReference)?.[1] ?? 0);

/**
 * Install the shared platform double. View metadata carries the raw
 * `@FILTERED_LIST` references and the rows' class, as the platform hands them
 * over; the table derives `Computers` from them.
 */
export const installExpandableTablePlatform = (): PlatformFake => {
  const region = {
    name: 'A',
    type: 'Region',
    children: columns.map((column) => ({
      type: 'ScalarList',
      config: {
        value: `@FILTERED_LIST .Computers[].${column.label}`,
        componentType: column.componentType,
        label: column.label,
        contextClass: ROW_CLASS,
      },
    })),
  };
  const view = {
    name: 'demoView',
    type: 'View',
    config: { template: 'ExpandableTable', ruleClass: 'Work-', inheritedProps: { label: 'Computer inventory' } },
    children: [region],
  };

  return installPlatformFake({
    /* A cell carries its field's label; a detail view does not. */
    renderView: (meta: any, options) => {
      const row = rowOf(options.pageReference ?? '');
      const column = columns.find((candidate) => candidate.label === meta.config?.label);
      if (!column) return <MockDetailView rowIndex={row} viewName={meta.name ?? ''} />;
      return <Text>{`${column.values[row] ?? ''}`}</Text>;
    },
    pConnect: {
      meta: { name: view.name },
      options: { viewName: 'ComputersTable' },
      getTarget: () => 'workarea',
      getPageReference: () => 'caseInfo.content',
      getCaseInfo: () => ({ getKey: () => CASE_KEY }),
      getChildren: () => view.children,
      getRawMetadata: () => view,
      getInheritedProps: () => view.config.inheritedProps,
      /* The platform resolves each list reference to that column's values. */
      resolveConfigProps: (config: { label: string }) => ({
        ...config,
        value: columns.find((column) => column.label === config.label)?.values ?? [],
      }),
    },
  });
};
