/**
 * Map's points are rows of an embedded list. The map itself needs ArcGIS,
 * which does not run under jsdom, but the writes it makes go through these
 * utilities, which can be tested against the shared platform fake.
 */
import { addPoint, deletePoints } from './utils';
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

let platform: PlatformFake;
beforeEach(() => {
  platform = installPlatformFake({ pConnect: { getTarget: () => 'app/primary' } });
});
afterEach(() => platform.restore());

/* Web Mercator x/y to longitude/latitude; a stand-in that keeps the numbers readable. */
const webMercatorUtils = { xyToLngLat: (x: number, y: number) => [x / 100, y / 100] };

test('adds a point by writing its longitude and latitude on its own row', () => {
  addPoint(platform.getPConnect, {}, '.Locations', '.Longitude', '.Latitude', 1, [-7400, 4071], webMercatorUtils);

  expect(platform.calls.pageCalls).toEqual([
    {
      pageReference: 'caseInfo.content.Locations[1]',
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.Longitude', -74],
    },
    {
      pageReference: 'caseInfo.content.Locations[1]',
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.Latitude', 40.71],
    },
  ]);
  expect(platform.calls.pages[0].options).toMatchObject({ target: 'app/primary' });
});

/* Deleting from the end keeps the remaining indexes valid while the list shrinks. */
test('deletes every point, last first, from the list', () => {
  deletePoints(platform.getPConnect, {}, '.Locations', 3);

  expect(platform.calls.pageCalls).toEqual(
    [2, 1, 0].map((index) => ({
      pageReference: 'caseInfo.content.Locations',
      api: 'listActions',
      method: 'deleteEntry',
      args: [index],
    })),
  );
  expect(platform.calls.pages).toHaveLength(1);
});

test('deletes nothing when there are no points', () => {
  deletePoints(platform.getPConnect, {}, '.Locations', 0);

  expect(platform.calls.pageCalls).toEqual([]);
});
