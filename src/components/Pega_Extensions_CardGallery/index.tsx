import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  withConfiguration,
  registerIcon,
  Text,
  Card,
  CardHeader,
  Progress,
  Button,
  Icon,
  EmptyState,
  ErrorState,
  Flex,
} from '@pega/cosmos-react-core';
import { Task } from './Task';
import { loadDetails, getFilters } from './utils';
import { createPlatform, type DashboardFilterPayload } from '../shared/platform';
import { MainCard } from './styles';
import '../shared/create-nonce';

import * as plusIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/plus.icon';
import * as pencilIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/pencil.icon';

registerIcon(plusIcon, pencilIcon);
type CardGalleryProps = {
  heading: string;
  dataPage: string;
  useInDashboard: boolean;
  numCards?: number;
  createClassname?: string;
  rendering: 'vertical' | 'horizontal';
  minWidth?: string;
  detailsDataPage: string;
  detailsViewName: string;
  getPConnect: any;
};

export const PegaExtensionsCardGallery = (props: CardGalleryProps) => {
  const {
    heading = '',
    dataPage = '',
    useInDashboard = true,
    numCards,
    createClassname = '',
    minWidth = '400px',
    rendering = 'vertical',
    detailsDataPage = '',
    detailsViewName = '',
    getPConnect,
  } = props;
  const [tasks, setTasks] = useState<any>();
  const filters = useRef<any>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const editTask = (id: string) => {
    getPConnect()
      .getActionsApi()
      .openLocalAction('pyUpdateCaseDetails', {
        caseID: id,
        containerName: 'modal',
        actionTitle: getPConnect().getLocalizedValue('Edit task'),
        type: 'express',
      });
  };

  const addNewEvent = () => {
    if (createClassname) {
      getPConnect().getActionsApi().createWork(createClassname, {
        openCaseViewAfterCreate: false,
      });
    }
  };

  const getDetails = (id: string, classname: string) => {
    return loadDetails({
      id,
      classname,
      detailsDataPage,
      detailsViewName,
      getPConnect,
    });
  };

  const loadTasks = (isFiltered: boolean) => {
    let payload = {};
    setErrorMsg('');
    if (useInDashboard) {
      const filterExpr = getFilters(filters.current);
      payload = {
        dataViewParameters: {},
        query: {
          ...(filterExpr ? { filter: filterExpr } : null),
          select: [
            { field: 'pyID' },
            { field: 'pyLabel' },
            { field: 'pyStatusWork' },
            { field: 'pzInsKey' },
            { field: 'pxObjClass' },
          ],
        },
      };
    }
    createPlatform(getPConnect)
      .caseData.query(dataPage, payload)
      .then(async (response: any) => {
        if (!isFiltered) {
          /* First time - no data loaded */
          if (response?.data?.data !== null) {
            const tmpTasks: any = [];
            response.data.data.forEach((item: any) => {
              tmpTasks.push({
                id: item.pyID,
                title: item.pyLabel,
                status: item.pyStatusWork,
                classname: item.pxObjClass,
                insKey: item.pzInsKey,
                isVisible: true,
                getDetails,
                editTask,
              });
            });
            let numTasks = tmpTasks.length;
            if (numTasks > 0) {
              tmpTasks.forEach(async (tmpTask: any) => {
                const details = await getDetails(tmpTask.id, tmpTask.classname);
                tmpTask.details = details;
                numTasks -= 1;
                if (numTasks === 0) {
                  setTasks(tmpTasks);
                  setLoading(false);
                  setIsEmpty(false);
                }
              });
            } else {
              setTasks(tmpTasks);
              setLoading(false);
              setIsEmpty(true);
            }
          } else {
            setTasks([]);
            setLoading(false);
            setIsEmpty(true);
          }
        } else {
          setTasks((prevTasks: any[]) => {
            const tmpTasks: any = [];
            let tmpIsEmpty = true;
            prevTasks?.forEach((tmpTask: any) => {
              let isVisible = false;
              response?.data?.data?.forEach((item: any) => {
                if (item.pyID === tmpTask.id) {
                  isVisible = true;
                  tmpIsEmpty = false;
                }
              });
              tmpTasks.push({ ...tmpTask, isVisible });
            });
            setIsEmpty(tmpIsEmpty);
            return tmpTasks;
          });
        }
      })
      .catch((error: any) => {
        if (error?.response?.data?.errorDetails?.length > 0 && error.response.data.errorDetails[0].localizedValue) {
          setErrorMsg(error.response.data.errorDetails[0].localizedValue);
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      });
  };

  /* Subscribe to changes to the assignment case */
  useEffect(() => {
    /* If an assignment is updated - force a reload of the events */
    return createPlatform(getPConnect).events.on('assignmentSubmission', () => loadTasks(false));
  }, []);

  /* Subscribe to dashboard filter changes only if useInDashboard is true */
  useEffect(() => {
    if (!useInDashboard) return undefined;
    const platform = createPlatform(getPConnect);
    const scope = { context: platform.context, id: 'dashboard-component-cardgallery' };

    const offChange = platform.events.on<DashboardFilterPayload>(
      'dashboardFilterChange',
      ({ filterId, filterExpression }) => {
        if (filterExpression) {
          filters.current[filterId] = filterExpression;
        } else {
          delete filters.current[filterId];
        }
        loadTasks(true);
      },
      scope,
    );
    const offClearAll = platform.events.on(
      'dashboardFilterClearAll',
      () => {
        filters.current = {};
        loadTasks(true);
      },
      scope,
    );

    return () => {
      offChange();
      offClearAll();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTasks(false);
  }, [numCards]);

  const genState = (content: ReactNode) => (
    <Flex container={{ pad: 2 }} height={10}>
      <Flex item={{ grow: 1, alignSelf: 'auto' }}>{content}</Flex>
    </Flex>
  );

  const content = useMemo(() => {
    if (loading) {
      return genState(
        <Progress
          placement='block'
          message={createPlatform(getPConnect).text.loadingContent()}
        />,
      );
    }
    if (errorMsg) {
      return genState(<ErrorState message={errorMsg} />);
    }
    if (isEmpty) {
      return genState(<EmptyState />);
    }
    return (
      <MainCard rendering={rendering} minWidth={minWidth}>
        {tasks?.map((task: any) =>
          task.isVisible ? <Task key={task.id} {...task} getPConnect={getPConnect} /> : null,
        )}
      </MainCard>
    );
  }, [loading, rendering, minWidth, tasks, getPConnect, errorMsg, isEmpty]);

  return (
    <Card>
      <CardHeader
        actions={
          createClassname ? (
            <Button
              variant='simple'
              label={getPConnect().getLocalizedValue('Create new task')}
              icon
              compact
              onClick={addNewEvent}
            >
              <Icon name='plus' />
            </Button>
          ) : undefined
        }
      >
        <Text variant='h2'>{heading}</Text>
      </CardHeader>

      {content}
    </Card>
  );
};

export default withConfiguration(PegaExtensionsCardGallery);
