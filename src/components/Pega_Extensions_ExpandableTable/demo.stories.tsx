import type { StoryObj } from '@storybook/react-webpack5';
import { Text } from '@pega/cosmos-react-core';
import { PegaExtensionsExpandableTable, type ExpandableTableProps } from './index';
import { MockDetailView, installExpandableTablePlatform } from './demo.fixtures';
import { installPlatformFake } from '../shared/platform/fake';

type configInfo = {
  value?: Array<any>;
  componentType?: string;
  label?: string;
  heading?: string;
};

type info = {
  config: configInfo;
  type: string;
  children?: Array<info>;
};

export default {
  title: 'Templates/Expandable Table',
  tags: ['Pega_Extensions_ExpandableTable'],
  argTypes: {
    detailViewName: {
      control: 'text',
      description: 'Name of the Pega view to render when a row is expanded',
    },
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    a11y: {
      context: '#storybook-root',
      config: {
        rules: [
          {
            id: 'autocomplete-valid',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsExpandableTable,
};

type Story = StoryObj<typeof PegaExtensionsExpandableTable>;

export const Default: Story = {
  render: (args: ExpandableTableProps) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installExpandableTablePlatform();
    return <PegaExtensionsExpandableTable {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    detailViewName: 'ComputerDetails',
  },
};

const genNestedLineItemsResponse = () => {
  const nestedView = {
    name: 'nestedLineItemsView',
    type: 'View',
    config: {
      template: 'ExpandableTable',
      ruleClass: 'Data-Order',
      inheritedProps: { label: 'Line items' },
    },
    children: [
      {
        name: 'A',
        type: 'Region',
        children: [
          {
            config: {
              value: ['Widget A', 'Widget B'],
              componentType: 'TextInput',
              label: 'Product',
            },
            type: 'ScalarList',
          },
          {
            config: {
              value: [2, 5],
              componentType: 'TextInput',
              label: 'Quantity',
            },
            type: 'ScalarList',
          },
        ] as Array<info>,
        getPConnect: () => ({
          getRawMetadata: () => nestedView.children[0],
        }),
      },
    ],
    classID: 'Data-Order',
  };
  return nestedView;
};

const getRowIndexFromPageRef = (pageRef: string): number => {
  const matches = [...pageRef.matchAll(/\[(\d+)\]/g)];
  return matches.length ? parseInt(matches[matches.length - 1][1], 10) : 0;
};

/* The nested-table demo: a store with one order holding line items, a view
   loaded over REST, and rows rendered as nested tables or detail views. */
const installNestedTablePlatform = (args: ExpandableTableProps) =>
  installPlatformFake({
    store: {
      workarea: {
        caseInfo: {
          content: {
            orders: [{ pxObjClass: 'Data-Order', LineItems: [{ pxObjClass: 'Data-LineItem' }] }],
          },
        },
      },
    },
    restResponses: {
      loadView: { data: { uiResources: { root: { config: { name: args.detailViewName } } } } },
    },
    viewMetadata: (name: string, ruleClass: string) => ({ type: 'View', config: { name, ruleClass } }),
    renderView: (f: any, options: Record<string, any>, pageMeta: any) => {
      if (f.type === 'View' || f.config?.name) {
        const pageRef: string = options.pageReference ?? '';
        const rowIndex = getRowIndexFromPageRef(pageRef);

        if (f.config?.name === 'OrderLineItems') {
          const nestedView = genNestedLineItemsResponse();
          const nestedProps: ExpandableTableProps = {
            detailViewName: '',
            getPConnect: () => ({
              meta: { name: 'NestedLineItems' },
              options: { viewName: 'OrderLineItems', pageReference: pageRef },
              getLocalizedValue: (val: string) => val,
              getContextName: () => 'workarea',
              getTarget: () => 'workarea',
              getPageReference: () => pageRef,
              getCaseInfo: () => ({ getKey: () => 'S-123' }),
              getValue: () => 'S-123',
              getChildren: () => nestedView.children,
              getRawMetadata: () => nestedView,
              getInheritedProps: () => nestedView.config.inheritedProps,
              setInheritedProp: () => {},
              setValue: () => {},
              resolveConfigProps: (fieldConfig: any) => ({
                ...fieldConfig,
                propref: fieldConfig.value,
                pageref: 'LineItems',
                contextClass: 'Data-LineItem',
              }),
            }),
          };
          return <PegaExtensionsExpandableTable {...nestedProps} />;
        }

        return <MockDetailView rowIndex={rowIndex} viewName={f.config?.name ?? ''} />;
      }
      const pageRef: string = options.pageReference ?? '';
      const rowIndex = getRowIndexFromPageRef(pageRef);
      const val = Array.isArray(pageMeta.config.value) ? pageMeta.config.value[rowIndex] : pageMeta.config.value;
      return <Text>{`${val ?? ''}`}</Text>;
    },
  });

const genOrdersResponse = () => {
  const demoView = {
    name: 'ordersView',
    type: 'View',
    config: {
      template: 'ExpandableTable',
      ruleClass: 'Work-',
      inheritedProps: { label: 'Order list' },
    },
    children: [
      {
        name: 'A',
        type: 'Region',
        children: [
          {
            config: {
              value: ['ORD-1001', 'ORD-1002'],
              componentType: 'TextInput',
              label: 'Order ID',
            },
            type: 'ScalarList',
          },
          {
            config: {
              value: ['Open', 'Closed'],
              componentType: 'TextInput',
              label: 'Status',
            },
            type: 'ScalarList',
          },
        ] as Array<info>,
        getPConnect: () => ({
          getRawMetadata: () => demoView.children[0],
        }),
      },
    ],
    classID: 'Work-MyComponents',
  };
  return demoView;
};

export const NestedTable: Story = {
  render: (args: ExpandableTableProps) => {
    installNestedTablePlatform(args);

    const ordersView = genOrdersResponse();
    const props: ExpandableTableProps = {
      ...args,
      getPConnect: () => ({
        meta: { name: 'OrdersTable' },
        options: { viewName: 'OrdersTable' },
        getLocalizedValue: (val: string) => val,
        getContextName: () => 'workarea',
        getTarget: () => 'workarea',
        getPageReference: () => 'caseInfo.content',
        getCaseInfo: () => ({ getKey: () => 'S-123' }),
        getValue: () => 'S-123',
        getChildren: () => ordersView.children,
        getRawMetadata: () => ordersView,
        getInheritedProps: () => ordersView.config.inheritedProps,
        setInheritedProp: () => {},
        setValue: () => {},
        resolveConfigProps: (fieldConfig: any) => ({
          ...fieldConfig,
          propref: fieldConfig.value,
          pageref: 'orders',
          contextClass: 'Data-Order',
        }),
      }),
    };

    return <PegaExtensionsExpandableTable {...props} />;
  },
  args: {
    detailViewName: 'OrderLineItems',
  },
};
