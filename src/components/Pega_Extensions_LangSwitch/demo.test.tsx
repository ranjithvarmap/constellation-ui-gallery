import { afterAll, afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as LangSwitchModule from './index';
import { formatTimezoneLabel, getAvailableTimezones, langSwitchRuntime, prioritizeTimezones } from './utils';
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

const reloadMock = jest.fn();
const intlRuntime = Intl as typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
};
const originalSupportedValuesOf = intlRuntime.supportedValuesOf;

let platform: PlatformFake;

/* The operator's session as the platform reports it; D_SetLocale succeeds. */
const installLangSwitchPlatform = (currentLocale = 'en_EN', currentTimezone = 'UTC') => {
  platform = installPlatformFake({
    environment: { useLocale: currentLocale, timeZone: currentTimezone },
    readDataPage: () => ({ success: true }),
  });
};

const buildPConnect = () => {
  return {
    getContextName: () => 'primary',
    getLocalizedValue: (value: string) => value,
  };
};

beforeEach(() => {
  jest.restoreAllMocks();
  reloadMock.mockReset();
  jest.spyOn(langSwitchRuntime, 'reloadPage').mockImplementation(reloadMock);
  intlRuntime.supportedValuesOf = jest.fn(() => ['UTC', 'America/New_York']);
});

test('renders current locale and language options', () => {
  installLangSwitchPlatform();

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      getPConnect={buildPConnect}
    />,
  );

  expect(screen.getByText('Language & Region')).toBeTruthy();
  expect(screen.getByText('Current language')).toBeTruthy();
  expect(screen.getAllByText('English')).toHaveLength(2);
  expect(screen.getByRole('option', { name: 'English' })).toBeTruthy();
  expect(screen.getByRole('option', { name: 'French' })).toBeTruthy();
  expect(screen.queryByText('Current timezone')).toBeNull();
  expect(screen.queryByRole('combobox', { name: 'Search timezone' })).toBeNull();
});

test('selects the configured locale that matches the current language on load', () => {
  installLangSwitchPlatform('fr-FR');

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      getPConnect={buildPConnect}
    />,
  );

  expect((screen.getByLabelText('Select language') as HTMLSelectElement).value).toBe('fr_FR');
  expect(screen.getAllByText('French')).toHaveLength(2);
});

test('shows the configured Java locale code when the runtime locale uses JavaScript formatting', () => {
  installLangSwitchPlatform('fr-fr');

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      showLocaleCode
      getPConnect={buildPConnect}
    />,
  );

  expect(screen.getByText('fr_FR')).toBeTruthy();
  expect((screen.getByLabelText('Select language') as HTMLSelectElement).value).toBe('fr_FR');
});

test('renders timezone controls when changeTimezone is true', () => {
  installLangSwitchPlatform();

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      changeTimezone
      getPConnect={buildPConnect}
    />,
  );

  expect(screen.getByText('Timezone preference')).toBeTruthy();
  expect(screen.getByText('Current timezone')).toBeTruthy();
  expect(screen.getByText('UTC (UTC+00:00)')).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Search timezone' })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(true);
});

test('renders compact language-only view with language codes for narrow nav placements', () => {
  installLangSwitchPlatform();

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      changeTimezone
      compactView
      getPConnect={buildPConnect}
    />,
  );

  expect(screen.queryByText('Language & Region')).toBeNull();
  expect(screen.queryByText('Current language')).toBeNull();
  expect(screen.queryByText('Timezone preference')).toBeNull();
  expect(screen.getByRole('button', { name: 'Select language' })).toBeTruthy();
  expect(screen.getByText('EN')).toBeTruthy();
});

test('formats timezone labels with utc offset and a friendly name', () => {
  expect(formatTimezoneLabel('America/Port-au-Prince', new Date(Date.parse('2026-01-15T12:00:00.000Z')))).toBe(
    '(UTC-05:00) - Port-au-Prince',
  );
  expect(formatTimezoneLabel('UTC', new Date(Date.parse('2026-01-15T12:00:00.000Z')))).toBe('(UTC+00:00) - UTC');
});

test('sorts timezones by utc offset and then friendly name', () => {
  const januaryReferenceDate = new Date(Date.parse('2026-01-15T12:00:00.000Z'));

  expect(formatTimezoneLabel('America/Chicago', januaryReferenceDate)).toBe('(UTC-06:00) - Chicago');
  expect(formatTimezoneLabel('America/New_York', januaryReferenceDate)).toBe('(UTC-05:00) - New York');
  expect(formatTimezoneLabel('UTC', januaryReferenceDate)).toBe('(UTC+00:00) - UTC');

  const renderedLabels = ['America/New_York', 'UTC', 'America/Chicago']
    .sort((left, right) => {
      const leftLabel = formatTimezoneLabel(left, januaryReferenceDate);
      const rightLabel = formatTimezoneLabel(right, januaryReferenceDate);

      return leftLabel.localeCompare(rightLabel);
    })
    .map((timezone) => formatTimezoneLabel(timezone, januaryReferenceDate));

  expect(renderedLabels).not.toEqual(['(UTC-06:00) - Chicago', '(UTC-05:00) - New York', '(UTC+00:00) - UTC']);
});

test('renders timezone options sorted by utc offset and name', () => {
  intlRuntime.supportedValuesOf = jest.fn(() => ['UTC', 'America/New_York', 'America/Chicago']);
  installLangSwitchPlatform('en_EN', 'UTC');

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"}]'
      changeTimezone
      getPConnect={buildPConnect}
    />,
  );

  expect(
    prioritizeTimezones(
      getAvailableTimezones('UTC', new Date(Date.parse('2026-01-15T12:00:00.000Z'))),
      'UTC',
      'America/New_York',
      true,
    ).slice(0, 3),
  ).toEqual(['America/New_York', 'UTC', 'America/Chicago']);
});

test('calls D_SetLocale and reloads when the data page succeeds', async () => {
  platform = installPlatformFake({ environment: { useLocale: 'en_EN' }, readDataPage: () => ({ status: 200 }) });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      changeTimezone
      persistChanges
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'fr_FR' } });

  await waitFor(() => {
    expect(platform.calls.dataPageReads[0]).toEqual({
      dataPage: 'D_SetLocale',
      context: 'primary',
      parameters: { useLocale: 'fr_FR' },
      options: { invalidateCache: true },
    });
    expect(reloadMock).toHaveBeenCalledWith('fr_FR');
  });
});

test('skips D_SetLocale and reloads immediately when persistChanges is false', async () => {
  platform = installPlatformFake({
    environment: { useLocale: 'en_EN', timeZone: 'UTC' },
    readDataPage: () => ({ status: 200 }),
  });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'fr_FR' } });

  await waitFor(() => {
    expect(platform.calls.dataPageReads).toEqual([]);
    expect(reloadMock).toHaveBeenCalledWith('fr_FR');
  });
});

test('calls D_SetLocale from the compact view when the language changes', async () => {
  platform = installPlatformFake({
    environment: { useLocale: 'en_EN', timeZone: 'UTC' },
    readDataPage: () => ({ status: 200 }),
  });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      compactView
      persistChanges
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Select language' }));
  fireEvent.click(await screen.findByRole('option', { name: /French/ }));

  await waitFor(() => {
    expect(platform.calls.dataPageReads[0]).toEqual({
      dataPage: 'D_SetLocale',
      context: 'primary',
      parameters: { useLocale: 'fr_FR' },
      options: { invalidateCache: true },
    });
    expect(reloadMock).toHaveBeenCalledWith('fr_FR');
  });
});

test('skips D_SetLocale from the compact view when persistChanges is false', async () => {
  platform = installPlatformFake({
    environment: { useLocale: 'en_EN', timeZone: 'UTC' },
    readDataPage: () => ({ status: 200 }),
  });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      compactView
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Select language' }));
  fireEvent.click(await screen.findByRole('option', { name: /French/ }));

  await waitFor(() => {
    expect(platform.calls.dataPageReads).toEqual([]);
    expect(reloadMock).toHaveBeenCalledWith('fr_FR');
  });
});

test('calls D_SetLocale with useTimeZone only when apply is clicked and shows a confirmation alert', async () => {
  platform = installPlatformFake({
    environment: { useLocale: 'en_EN', timeZone: 'UTC' },
    readDataPage: () => ({ success: true }),
  });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"},{"name":"French","locale":"fr_FR"}]'
      changeTimezone
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.click(screen.getByRole('combobox', { name: 'Search timezone' }));
  fireEvent.click(await screen.findByRole('option', { name: formatTimezoneLabel('America/New_York') }));

  expect(platform.calls.dataPageReads).toEqual([]);

  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

  await waitFor(() => {
    expect(platform.calls.dataPageReads[0]).toEqual({
      dataPage: 'D_SetLocale',
      context: 'primary',
      parameters: { useTimeZone: 'America/New_York' },
      options: { invalidateCache: true },
    });
  });

  expect(reloadMock).not.toHaveBeenCalled();
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByText(/Timezone preference saved\./)).toBeTruthy();
  expect(screen.getByText(/next time you log in\./)).toBeTruthy();
});

test('treats a resolved timezone save without a status code as successful', async () => {
  platform = installPlatformFake({
    environment: { useLocale: 'en_EN', timeZone: 'UTC' },
    readDataPage: () => undefined,
  });

  render(
    <LangSwitchModule.PegaExtensionsLangSwitch
      Configuration='[{"name":"English","locale":"en_EN"}]'
      changeTimezone
      getPConnect={buildPConnect}
    />,
  );

  fireEvent.click(screen.getByRole('combobox', { name: 'Search timezone' }));
  fireEvent.click(await screen.findByRole('option', { name: formatTimezoneLabel('America/New_York') }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('Unable to switch timezone.')).toBeNull();
});

afterEach(() => {
  platform?.restore();
});

afterAll(() => {
  intlRuntime.supportedValuesOf = originalSupportedValuesOf;
});
