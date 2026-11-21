/**
 * The platform a Utility List runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'OPGO8L-CARINSUR-WORK C-77';

/** The appointments the data page returns. */
export const appointments = () => [
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'A-1004',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for John smith',
    pxCreateOpName: 'Marc Doe',
  },
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'A-1005',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for Sue Lee',
    pxCreateOpName: 'John Louis',
  },
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'C-1005',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for John Louis',
    pxCreateOpName: 'John Louis',
  },
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'D-4045',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for Mark Smith',
    pxCreateOpName: 'John Louis',
  },
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'AB-305',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for John Louis',
    pxCreateOpName: 'John Louis',
  },
  {
    pzInsKey: 'OPGO8L-CARINSUR-WORK A-1004',
    pxUpdateOpName: 'Marc Doe',
    pxObjClass: 'OPGO8L-CarInsur-Work-Appointment',
    pyID: 'BD-85',
    pxCreateDateTime: '2023-07-21T18:45:38.411Z',
    pyLabel: 'Appointment for John Doe',
    pxCreateOpName: 'John Louis',
  },
];

/** Install the shared platform double: six appointments for case C-77. */
export const installUtilityListPlatform = (): PlatformFake =>
  installPlatformFake({ caseInfo: { key: CASE_KEY }, rows: appointments() });
