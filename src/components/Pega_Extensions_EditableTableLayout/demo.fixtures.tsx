/**
 * The platform an Editable Table Layout runs against, shared by its story and
 * its test, so the test can assert on what the story's component actually does.
 */
import { CurrencyInput, DateInput, Input } from '@pega/cosmos-react-core';
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

type Column = { label: string; componentType: string; values: (string | number)[] };

/** The `.Computers` list, column by column, as its rows hold it. */
const computers = (): Column[] => [
  { label: 'Brand', componentType: 'TextInput', values: ['HP', 'Lenovo', 'Apple'] },
  {
    label: 'Description',
    componentType: 'TextInput',
    values: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Another description',
      'simple description',
    ],
  },
  { label: 'Memory', componentType: 'TextInput', values: ['16Gb', '8Gb', '8Gb'] },
  { label: 'Release Date', componentType: 'Date', values: ['2024-12-24', '2024-10-01', '2024-05-26'] },
  { label: 'Price', componentType: 'Currency', values: [1200.0, 1345.0, 1499.0] },
  { label: 'ID', componentType: 'TextInput', values: ['S-1', 'S-2', 'S-3'] },
];

/** `caseInfo.content.Computers[2]` -> 2 */
const rowOf = (pageReference: string) => Number(/\[(\d+)\]$/.exec(pageReference)?.[1] ?? -1);

/**
 * Install the shared platform double, with the PConnect an Editable Table
 * Layout reads. View metadata carries the raw `@FILTERED_LIST` references, as
 * the platform hands them over; the layout derives `Computers` from them.
 * Every install gets fresh copies, because deleting a row splices the values.
 */
export const installEditableTablePlatform = (): PlatformFake => {
  const columns = computers();
  const region = {
    name: 'A',
    type: 'Region',
    children: columns.map((column) => ({
      type: 'ScalarList',
      config: {
        value: `@FILTERED_LIST .Computers[].${column.label.replace(/\s/g, '')}`,
        componentType: column.componentType,
        label: column.label,
      },
    })),
  };
  const view = {
    name: 'demoView',
    type: 'View',
    config: { template: 'EditableTableLayout', ruleClass: 'Work-', inheritedProps: { label: 'Edit computers' } },
    children: [region],
    classID: 'Work-MyComponents',
  };

  return installPlatformFake({
    /* One cell: the field's value in the row the page reference names. */
    renderView: (meta: any, options) => {
      const column = columns.find((candidate) => candidate.label === meta.config.label);
      const value = column?.values[rowOf(options.pageReference ?? '')] ?? '';
      if (meta.type === 'Currency') {
        return (
          <CurrencyInput
            label={meta.config.label}
            labelHidden
            currencyISOCode='USD'
            value={`${value}`}
            onChange={() => {}}
          />
        );
      }
      if (meta.type === 'Date') {
        return <DateInput label={meta.config.label} labelHidden value={`${value}`} />;
      }
      return <Input label={meta.config.label} labelHidden value={`${value}`} readOnly />;
    },
    pConnect: {
      /* A real PConnect carries its view's metadata and options. */
      meta: { name: view.name },
      options: { viewName: 'ComputersView' },
      getTarget: () => 'workarea',
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
