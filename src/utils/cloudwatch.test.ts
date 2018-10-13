import { deleteAllLogs, filterLogEvents as getEvents } from './cloudwatch';

jest.mock('aws-sdk', () => {
  const deleteLogStreamValue = { promise: jest.fn() };
  const deleteLogStream = jest.fn(() => deleteLogStreamValue);
  const describeLogStreamsValue = { promise: jest.fn() };
  const describeLogStreams = jest.fn(() => describeLogStreamsValue);
  const filterLogEventsValue = { promise: jest.fn() };
  const filterLogEvents = jest.fn(() => filterLogEventsValue);
  const CloudWatchLogs = jest.fn(() => ({
    deleteLogStream,
    describeLogStreams,
    filterLogEvents,
  }));
  return { CloudWatchLogs };
});

describe('cloudwatch utils', () => {
  const AWS = require('aws-sdk');
  const cloudWatchLogs = AWS.CloudWatchLogs;

  const [region, functionName] = ['region', 'functionName'];

  const logGroupName = `/aws/lambda/${functionName}`;

  describe('deleteAllLogs', () => {
    test('should not call deleteLogStream on no log streams', async () => {
      const describeLogStreams = cloudWatchLogs().describeLogStreams;
      const deleteLogStream = cloudWatchLogs().deleteLogStream;
      const promise = describeLogStreams().promise;
      promise.mockReturnValue(Promise.resolve({ logStreams: undefined }));

      jest.clearAllMocks();

      await deleteAllLogs(region, functionName);

      expect(cloudWatchLogs).toHaveBeenCalledTimes(1);
      expect(cloudWatchLogs).toHaveBeenCalledWith({ region });
      expect(describeLogStreams).toHaveBeenCalledTimes(1);
      expect(describeLogStreams).toHaveBeenCalledWith({
        descending: true,
        logGroupName,
        orderBy: 'LastEventTime',
      });
      expect(deleteLogStream).toHaveBeenCalledTimes(0);
    });

    test('should call deleteLogStream on log streams', async () => {
      const describeLogStreams = cloudWatchLogs().describeLogStreams;
      const deleteLogStream = cloudWatchLogs().deleteLogStream;
      const promise = describeLogStreams().promise;

      const logStreams = [
        { logStreamName: 'logStreamName1' },
        { logStreamName: '' },
      ];
      promise.mockReturnValue(Promise.resolve({ logStreams }));

      jest.clearAllMocks();

      await deleteAllLogs(region, functionName);

      expect(deleteLogStream).toHaveBeenCalledTimes(logStreams.length);

      logStreams.forEach(({ logStreamName }) => {
        expect(deleteLogStream).toHaveBeenCalledWith({
          logGroupName,
          logStreamName,
        });
      });
    });
  });

  describe('filterLogEvents', () => {
    test('should return log events', async () => {
      const filterLogEvents = cloudWatchLogs().filterLogEvents;
      const promise = filterLogEvents().promise;
      const events = ['event1', 'event2'];
      promise.mockReturnValue(Promise.resolve({ events }));

      jest.clearAllMocks();

      const filterPattern = 'filterPattern';
      const actual = await getEvents(region, functionName, filterPattern);

      expect(cloudWatchLogs).toHaveBeenCalledTimes(1);
      expect(cloudWatchLogs).toHaveBeenCalledWith({ region });
      expect(filterLogEvents).toHaveBeenCalledTimes(1);
      expect(filterLogEvents).toHaveBeenCalledWith({
        filterPattern: `"${filterPattern}"`,
        interleaved: true,
        limit: 1,
        logGroupName,
      });
      expect(actual).toEqual({ events });
    });

    test('should return empty array on undefined events', async () => {
      const filterLogEvents = cloudWatchLogs().filterLogEvents;
      const promise = filterLogEvents().promise;
      promise.mockReturnValue(Promise.resolve({}));

      jest.clearAllMocks();

      const filterPattern = 'filterPattern';
      const actual = await getEvents(region, functionName, filterPattern);

      expect(actual).toEqual({ events: [] });
    });
  });
});
