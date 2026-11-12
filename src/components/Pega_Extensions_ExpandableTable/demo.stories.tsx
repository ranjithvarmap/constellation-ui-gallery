import type { StoryObj } from '@storybook/react-webpack5';
import { Text } from '@pega/cosmos-react-core';
import { PegaExtensionsExpandableTable, type ExpandableTableProps } from './index';
import { MockDetailView, installExpandableTablePlatform } from './demo.fixtures';

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

const createMockPCore = (args: ExpandableTableProps) => ({
  getLocaleUtils: () => ({
    getLocaleValue: (val: string) => val,
  }),
  getConstants: () => ({
    CASE_INFO: {
      CASE_INFO_ID: 'caseInfo.ID',
    },
  }),
  getContextTreeManager: () => ({
    addPageListNode: () => {},
  }),
  getViewResources: () => ({
    fetchViewResources: (name: string, _pConnect: any, ruleClass: string) => ({
      type: 'View',
      config: {
        name,
        ruleClass,
      },
    }),
    updateViewResources: () => Promise.resolve(),
  }),
  getRestClient: () => ({
    invokeRestApi: () =>
      Promise.resolve({
        data: {
          uiResources: {
            root: {
              config: { name: args.detailViewName },
            },
          },
        },
      }),
  }),
  getStore: () => ({
    getState: () => ({
      data: {
        workarea: {
          caseInfo: {
            content: {
              orders: [{ pxObjClass: 'Data-Order', LineItems: [{ pxObjClass: 'Data-LineItem' }] }],
            },
          },
        },
      },
    }),
  }),
  createPConnect: (context: any) => ({
    getPConnect: () => ({
      createComponent: (f: any) => {
        if (f.type === 'View' || f.config?.name) {
          const pageRef: string = context.options.pageReference ?? '';
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
        const pageRef: string = context.options.pageReference ?? '';
        const rowIndex = getRowIndexFromPageRef(pageRef);
        const val = Array.isArray(context.meta.config.value)
          ? context.meta.config.value[rowIndex]
          : context.meta.config.value;
        return <Text>{`${val ?? ''}`}</Text>;
      },
      getTarget: () => 'workarea',
    }),
  }),
  getComponentsRegistry: () => ({
    getLazyComponent: (f: string) => f,
  }),
  getAssetLoader: () => ({
    getLoader: () => () => Promise.resolve(),
  }),
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
    (window as any).PCore = createMockPCore(args);

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
