import ElkClientCommands from './ElkClientCommands';
import {
  TextDescriptionType,
  ElkCommand,
  ZoneTrigger,
  ElkResponse,
  KeypadFunctionKeyStatusRequest,
  ZoneVoltageRequest,
  ZoneVoltageData,
  ZoneDefinitionData,
  ZoneDefinitionRequest,
  ZoneStatusRequest,
  ZoneStatusReport,
  ZonePartitionRequest,
  ZonePartitionReport,
  SystemTroubleStatusReply,
  Omnistat2Reply,
  VersionNumberReply,
  VersionNumberRequest,
  Omnistat2Request,
  SystemTroubleStatusRequest,
  TextDescriptionRequest,
  TextDescriptionReply,
  RealTimeClockDataWrite,
  RealTimeClockDataReply,
  DayOfWeek,
  RealTimeClockDataRequest,
  TemperatureDataRequest,
  TemperatureData,
  KeypadAreaAssigmentsRequest,
  KeypadAreaAssignments,
  ControlOutputStatusRequest,
  ControlOutputStatusReport,
  AlarmByZoneRequest,
  AlarmByZoneReport,
  ZoneBypassRequest,
  ZoneBypassReply,
  UserCodeAreasRequest,
  UserCodeAreasReply,
  ThermostatMode,
  ThermostatSetType,
  ThermostatData,
  ArmingLevel,
  Arm,
  TaskActivation,
  SpeakPhrase,
  SpeakWord,
  PlcDeviceToggle,
  PlcDeviceControl,
  PlcDeviceOff,
  PlcDeviceOn,
  PlcFunctionCode,
  DisplayTextClearOption,
  DisplayTextOnScreen,
  ControlOutputToggle,
  ControlOutputOn,
  ControlOutputOff,
  TemperatureDeviceType,
  TemperatureReply,
  PlcDeviceStatusReply,
  LogWriteType,
  SystemLogDataUpdate,
  KeypadKeyChange,
  FunctionKey,
  KeypadFunctionKeyPressReply,
  InsteonLightingDeviceProgrammed,
  InsteonLightingDeviceStatusReply,
  LightingDeviceDataReply,
  CounterValueReply,
  UserCodeChangeReply,
  CustomValueReply,
  CustomNumberValue,
  CustomValueFormat,
  AudioDataReply,
  ArmingStatusRequest,
  ArmingStatusReport
} from 'elk-message';
import TimeoutError from './errors/TimeoutError';
import { cd } from 'shelljs';

class ElkClientCommandsImpl extends ElkClientCommands {
  constructor(
    readonly sendCommand: (command: ElkCommand) => Promise<void>,
    readonly defaultTimeout: number
  ) {
    super();
  }
}

/**
 * Methods that send a command and wait for a response based solely
 * on the response class type.
 */
const sendCommandForResponseTypeTests: [
  keyof ElkClientCommands,
  { new (...args: any[]): ElkCommand },
  { new (...args: any[]): ElkResponse },
  any[]?,
  string?
][] = [
  ['getArmingStatus', ArmingStatusRequest, ArmingStatusReport],
  ['getAlarmsByZone', AlarmByZoneRequest, AlarmByZoneReport],
  ['getControlOutputStatus', ControlOutputStatusRequest, ControlOutputStatusReport],
  ['getKeypadAreaAssignments', KeypadAreaAssigmentsRequest, KeypadAreaAssignments],
  ['getTemperatureData', TemperatureDataRequest, TemperatureData],
  ['getRealTimeClock', RealTimeClockDataRequest, RealTimeClockDataReply],
  [
    'setRealTimeClock',
    RealTimeClockDataWrite,
    RealTimeClockDataReply,
    [2017, 5, 15, DayOfWeek.Monday, 11, 32, 44]
  ],
  [
    'getDescription',
    TextDescriptionRequest,
    TextDescriptionReply,
    [TextDescriptionType.AreaName, 3]
  ],
  ['getTroubleStatus', SystemTroubleStatusRequest, SystemTroubleStatusReply],
  ['getOmnistat2Data', Omnistat2Request, Omnistat2Reply, ['fooo']],
  ['getVersionNumber', VersionNumberRequest, VersionNumberReply],
  ['getZonePartitions', ZonePartitionRequest, ZonePartitionReport],
  ['getZoneStatus', ZoneStatusRequest, ZoneStatusReport],
  ['getZoneDefinitions', ZoneDefinitionRequest, ZoneDefinitionData]
];

/**
 * Methods that only send a command and don't wait for a reply.
 */
const sendCommandOnlyTest: [
  keyof ElkClientCommands,
  (cmd: ElkClientCommands) => Promise<void>,
  { new (...args: any[]): ElkCommand },
  any
][] = [
  [
    'arm',
    cmd => cmd.arm(2, ArmingLevel.ArmedStay, '1234'),
    Arm,
    { areaNumber: 2, armingLevel: ArmingLevel.ArmedStay, userCode: '1234' }
  ],
  [
    'disarm',
    cmd => cmd.disarm(4, '567891'),
    Arm,
    { areaNumber: 4, armingLevel: ArmingLevel.Disarm, userCode: '567891' }
  ],
  ['setControlOutputOff', cmd => cmd.setControlOutputOff(13), ControlOutputOff, { output: 13 }],
  ['setControlOutputOn', cmd => cmd.setControlOutputOn(79), ControlOutputOn, { output: 79 }],
  ['toggleControlOutput', cmd => cmd.toggleControlOutput(20), ControlOutputToggle, { output: 20 }],
  [
    'displayTextOnScreen',
    cmd =>
      cmd.displayTextOnScreen(3, 'Hello', 'There', DisplayTextClearOption.ClearWithStarKey, true),
    DisplayTextOnScreen,
    {
      areaNumber: 3,
      beep: true,
      clearOption: DisplayTextClearOption.ClearWithStarKey,
      firstLine: 'Hello',
      secondLine: 'There',
      subMessageType: 'm',
      timeout: 0
    }
  ],
  [
    'clearTextOnScreen',
    cmd => cmd.clearTextOnScreen(5, false),
    DisplayTextOnScreen,
    {
      areaNumber: 5,
      beep: false
    }
  ],
  [
    'setPlcDevice',
    cmd => cmd.setPlcDevice('house', 3, PlcFunctionCode.Bright, 67, 1000),
    PlcDeviceControl,
    {
      houseCode: 'house',
      unitCode: 3,
      functionCode: PlcFunctionCode.Bright,
      extendedCode: 67,
      onTime: 1000
    }
  ],
  [
    'setPlcDeviceOff',
    cmd => cmd.setPlcDeviceOff('Cherry', 41),
    PlcDeviceOff,
    { houseCode: 'Cherry', unitCode: 41 }
  ],
  [
    'setPlcDeviceOn',
    cmd => cmd.setPlcDeviceOn('Banana', 10),
    PlcDeviceOn,
    { houseCode: 'Banana', unitCode: 10 }
  ],
  [
    'togglePlcDevice',
    cmd => cmd.togglePlcDevice('Apple', 4),
    PlcDeviceToggle,
    { houseCode: 'Apple', unitCode: 4 }
  ],
  ['speakWord', cmd => cmd.speakWord(42), SpeakWord, { wordNumber: 42 }],
  ['speakPhrase', cmd => cmd.speakPhrase(100), SpeakPhrase, { phraseNumber: 100 }],
  ['activateTask', cmd => cmd.activateTask(4), TaskActivation, { taskNumber: 4 }],
  ['triggerZone', cmd => cmd.triggerZone(32), ZoneTrigger, { zoneNumber: 32 }]
];

describe('ElkClientCommands', () => {
  let sendCommandMock: jest.Mock<any>;
  let classMock: ElkClientCommandsImpl;

  beforeEach(() => {
    sendCommandMock = jest.fn().mockResolvedValue({});
    classMock = new ElkClientCommandsImpl(sendCommandMock, 10);
  });

  afterEach(() => {
    classMock.removeAllListeners();
  });

  describe('waitForResponse', () => {
    test('received within timeout resolves with response', async () => {
      expect.assertions(1);
      const emittedMessage = new ElkResponse('XXXXXX');
      setTimeout(() => {
        classMock.emit('message', emittedMessage);
      });
      const response = await classMock.waitForResponse(() => true, 100);
      expect(response).toBe(emittedMessage);
    });

    test('received after timeout rejects with TimeoutError', async () => {
      expect.assertions(2);
      const emittedMessage = new ElkResponse('CCCCC');
      let emitted = false;
      const timeout = setTimeout(() => {
        emitted = true;
        classMock.emit('message', emittedMessage);
      }, 200);

      try {
        await classMock.waitForResponse(() => true, 100);
      } catch (err) {
        expect(emitted).toBe(false);
        clearTimeout(timeout);
        expect(err).toBeInstanceOf(TimeoutError);
      }
    });

    test('not received rejects with TimeoutError', async () => {
      expect.assertions(1);
      try {
        const foo = await classMock.waitForResponse(() => true, 100);
      } catch (err) {
        expect(err).toBeInstanceOf(TimeoutError);
      }
    });
  });

  describe('waitForOk', () => {
    test('received within timeout resolves', async () => {
      expect.assertions(1);
      setTimeout(() => {
        classMock.emit('ok');
      });
      const response = await classMock.waitForOk(100);
      expect(response).toBeUndefined();
    });

    test('received after timeout rejects with TimeoutError', async () => {
      expect.assertions(2);
      const emittedMessage = new ElkResponse('CCCCC');
      let emitted = false;
      const timeout = setTimeout(() => {
        emitted = true;
        classMock.emit('ok');
      }, 200);

      try {
        await classMock.waitForOk(100);
      } catch (err) {
        expect(emitted).toBe(false);
        clearTimeout(timeout);
        expect(err).toBeInstanceOf(TimeoutError);
      }
    });

    test('not received rejects with TimeoutError', async () => {
      expect.assertions(1);
      try {
        const foo = await classMock.waitForOk(100);
      } catch (err) {
        expect(err).toBeInstanceOf(TimeoutError);
      }
    });
  });

  test('getAudioData', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new AudioDataReply('20CA0110205006004010500000000000C1\r\n');
    const matchingResponse = new AudioDataReply('20CA0210205006004010500000000000C1\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getAudioData(2)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({ zoneNumber: 2 }),
      expect.anything()
    );
  });

  test('getCustomValues', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new CustomValueReply('0ECR070045610004\r\n');
    const matchingResponse = new CustomValueReply(
      '0ECR000012300045610541620000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003\r\n'
    );
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getCustomValues()).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({ messageType: 'c', subMessageType: 'p' }),
      expect.anything()
    );
  });

  test('getCustomValue', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new CustomValueReply('0ECR070045610004\r\n');
    const matchingResponse = new CustomValueReply('0ECR020045610004\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getCustomValue(2)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({ valueNumber: 2 }),
      expect.anything()
    );
  });

  test('setCustomValue', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new CustomValueReply('0DCV0100123003C\r\n');
    const matchingResponse = new CustomValueReply('0DCV0300007003C\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setCustomValue(3, new CustomNumberValue(9))).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        valueNumber: 3,
        value: {
          format: CustomValueFormat.Number,
          value: 9
        }
      }),
      expect.anything()
    );
  });

  test('changeUserCode', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new UserCodeChangeReply('09CU000000F\r\n');
    const matchingResponse = new UserCodeChangeReply('09CU005000A\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.changeUserCode(5, '123456', '2345')).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({ userCode: 5 }),
      expect.anything()
    );
  });

  test('getCounterValue', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new CounterValueReply('0DCV0400007003C\r\n');
    const matchingResponse = new CounterValueReply('0DCV0100123003C\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getCounterValue(1)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({ counterNumber: 1 }),
      expect.anything()
    );
  });

  test('setCounterValue', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new CounterValueReply('0DCV0100123003C\r\n');
    const matchingResponse = new CounterValueReply('0DCV0400007003C\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setCounterValue(4, 7)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        counterNumber: 4,
        value: 7
      }),
      expect.anything()
    );
  });

  test('getLightingDeviceStatus', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new LightingDeviceDataReply('0BDS001990094\r\n');
    const matchingResponse = new LightingDeviceDataReply('0BDS003990094\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getLightingDeviceStatus(3)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        lightingDeviceNumber: 3
      }),
      expect.anything()
    );
  });

  test('getInsteonLightingDeviceStatus', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new InsteonLightingDeviceStatusReply(
      '22IR0034123456ABCDEF987654A1B2C3006F\r\n'
    );
    const matchingResponse = new InsteonLightingDeviceStatusReply(
      '22IR0014123456ABCDEF987654A1B2C3006F\r\n'
    );
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getInsteonLightingDeviceStatus(1, 4)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        startingDeviceNumber: 1,
        deviceCount: 4
      }),
      expect.anything()
    );
  });

  test('setInsteaonLightingDevice', async () => {
    expect.assertions(2);
    const nonMatchingResponse = new ElkResponse('00XX0000000000\r\n');
    const matchingResponse = new InsteonLightingDeviceProgrammed('0AIP001400D1\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setInsteaonLightingDevice(1, ['a', 'b', 'c', 'd'])).toBe(
      matchingResponse
    );
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        startingDeviceNumber: 1
      }),
      expect.anything()
    );
  });

  test('getKeypadFunctionKeyStatus', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new KeypadKeyChange('0AIP001400D1\r\n');
    const matchingResponse = new KeypadKeyChange('19KC03112010000200000000010\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getKeypadFunctionKeyStatus(3)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        keypadNumber: 3
      }),
      expect.anything()
    );
  });

  describe('pressKeypadFunctionKey', () => {
    test('F1', async () => {
      expect.assertions(2);
      const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
      const nonMatchingResponse2 = new KeypadFunctionKeyPressReply('11KF01C200000000087\r\n');
      const matchingResponse = new KeypadFunctionKeyPressReply('11KF021200000000087\r\n');
      setTimeout(() => {
        classMock.emit('message', nonMatchingResponse1);
        classMock.emit('message', nonMatchingResponse2);
        classMock.emit('message', matchingResponse);
      });
      expect(await classMock.pressKeypadFunctionKey(2, FunctionKey.F1)).toBe(matchingResponse);
      expect(sendCommandMock).toBeCalledWith(
        expect.objectContaining({
          keypadNumber: 2,
          functionKey: FunctionKey.F1
        }),
        expect.anything()
      );
    });

    test('none', async () => {
      expect.assertions(2);
      const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
      const nonMatchingResponse2 = new KeypadFunctionKeyPressReply('11KF01C200000000087\r\n');
      const matchingResponse = new KeypadFunctionKeyPressReply('11KF030200000000087\r\n');
      setTimeout(() => {
        classMock.emit('message', nonMatchingResponse1);
        classMock.emit('message', nonMatchingResponse2);
        classMock.emit('message', matchingResponse);
      });
      expect(await classMock.pressKeypadFunctionKey(3)).toBe(matchingResponse);
      expect(sendCommandMock).toBeCalledWith(
        expect.objectContaining({
          keypadNumber: 3,
          functionKey: FunctionKey.None
        }),
        expect.anything()
      );
    });
  });

  test('getSystemLogData', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('00XX0000000000\r\n');
    const nonMatchingResponse2 = new SystemLogDataUpdate('1CLD1193102119450607001505003F\r\n');
    const matchingResponse = new SystemLogDataUpdate('1CLD1193102119450607500505003F\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getSystemLogData(500)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        logIndex: 500
      }),
      expect.anything()
    );
  });

  test('writeSystemLogData', async () => {
    expect.assertions(1);
    const nonMatchingResponse = new ElkResponse('0CZV042072004E\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse);
      classMock.emit('ok');
    });
    await classMock.writeSystemLogData(LogWriteType.Alarm, 34, 22, 4);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        logType: LogWriteType.Alarm,
        eventType: 34,
        zoneNumber: 22,
        areaNumber: 4
      }),
      expect.anything()
    );
  });

  test('getPlcStatus', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new PlcDeviceStatusReply(
      '47PS001111111111111110000000000000000000000000000000000000000000000000053\r\n'
    );
    const matchingResponse = new PlcDeviceStatusReply(
      '47PS301111111111111110000000000000000000000000000000000000000000000000053\r\n'
    );
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getPlcStatus(3)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(expect.objectContaining({ bank: 3 }), expect.anything());
  });

  test('getTemperature', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new TemperatureReply('0CST001135005C\r\n');
    const matchingResponse = new TemperatureReply('0CST1021050058\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getTemperature(TemperatureDeviceType.Keypad, 2)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        deviceType: TemperatureDeviceType.Keypad,
        deviceNumber: 2
      }),
      expect.anything()
    );
  });

  test('getThermostatData', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR04200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getThermostatData(4)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 4
      }),
      expect.anything()
    );
  });

  test('setThermostat', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostat(2, 65, ThermostatSetType.CoolSetPoint)).toBe(
      matchingResponse
    );
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.CoolSetPoint,
        value: 65
      }),
      expect.anything()
    );
  });

  test('setThermostatCoolSetPoint', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostatCoolSetPoint(2, 72)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.CoolSetPoint,
        value: 72
      }),
      expect.anything()
    );
  });

  test('setThermostatHeatSetPoint', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostatHeatSetPoint(2, 75)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.HeatSetPoint,
        value: 75
      }),
      expect.anything()
    );
  });

  test('setThermostatFan', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostatFan(2, false)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.Fan,
        value: 0
      }),
      expect.anything()
    );
  });

  test('setThermostatMode', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostatMode(2, ThermostatMode.EmergencyHeat)).toBe(
      matchingResponse
    );
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.Mode
      }),
      expect.anything()
    );
  });

  test('setThermostatHold', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ThermostatData('13TR01200726875000000\r\n');
    const matchingResponse = new ThermostatData('13TR02200726875000000\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.setThermostatHold(2, true)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(
      expect.objectContaining({
        thermostatNumber: 2,
        element: ThermostatSetType.Hold,
        value: 1
      }),
      expect.anything()
    );
  });

  describe('getValidUserCodeAreas', () => {
    test('6 digit code', async () => {
      expect.assertions(2);
      const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
      const nonMatchingResponse2 = new ZoneBypassReply('0AZB000400CC\r\n');
      const matchingResponse = new UserCodeAreasReply('19UA123456C30000000041F00CA\r\n');
      setTimeout(() => {
        classMock.emit('message', nonMatchingResponse1);
        classMock.emit('message', nonMatchingResponse2);
        classMock.emit('message', matchingResponse);
      });
      expect(await classMock.getValidUserCodeAreas('123456')).toBe(matchingResponse);
      expect(sendCommandMock).toBeCalledWith(expect.any(UserCodeAreasRequest), expect.anything());
    });

    test('4 digit code', async () => {
      expect.assertions(2);
      const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
      const nonMatchingResponse2 = new ZoneBypassReply('0AZB000400CC\r\n');
      const matchingResponse = new UserCodeAreasReply('19UA003456C30000000041F00CA\r\n');
      setTimeout(() => {
        classMock.emit('message', nonMatchingResponse1);
        classMock.emit('message', nonMatchingResponse2);
        classMock.emit('message', matchingResponse);
      });
      expect(await classMock.getValidUserCodeAreas('3456')).toBe(matchingResponse);
      expect(sendCommandMock).toBeCalledWith(expect.any(UserCodeAreasRequest), expect.anything());
    });
  });

  test('toggleBypassForZone', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ZoneBypassReply('0AZB000400CC\r\n');
    const matchingResponse = new ZoneBypassReply('0AZB123100CC\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.toggleBypassForZone('4567', 123)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(expect.any(ZoneBypassRequest), expect.anything());
  });

  test('toggleBypassForArea', async () => {
    expect.assertions(2);
    const nonMatchingResponse1 = new ElkResponse('0CZV042072004E\r\n');
    const nonMatchingResponse2 = new ZoneBypassReply('0AZB123100CC\r\n');
    const matchingResponse = new ZoneBypassReply('0AZB000400CC\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse1);
      classMock.emit('message', nonMatchingResponse2);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.toggleBypassForArea('4567', 4)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(expect.any(ZoneBypassRequest), expect.anything());
  });

  test('getZoneVoltage', async () => {
    expect.assertions(2);
    const nonMatchingResponse = new ZoneVoltageData('0CZV042072004E\r\n');
    const matchingResponse = new ZoneVoltageData('0CZV123072004E\r\n');
    setTimeout(() => {
      classMock.emit('message', nonMatchingResponse);
      classMock.emit('message', matchingResponse);
    });
    expect(await classMock.getZoneVoltage(123)).toBe(matchingResponse);
    expect(sendCommandMock).toBeCalledWith(expect.any(ZoneVoltageRequest), expect.anything());
  });

  sendCommandOnlyTest.forEach(([name, executor, CommandClass, commandShape]) => {
    test(name, async () => {
      expect.assertions(2);
      // await (classMock[name] as (...args: any[]) => any)(...args);
      await executor(classMock);
      expect(sendCommandMock).toBeCalledWith(expect.any(CommandClass), expect.anything());
      expect(sendCommandMock).toBeCalledWith(
        expect.objectContaining(commandShape),
        expect.anything()
      );
    });
  });

  sendCommandForResponseTypeTests.forEach(
    ([name, CommandClass, ResponseClass, commandArgs, responseRaw]) => {
      test(name, async () => {
        expect.assertions(2);
        const nonMatchingResponse = new ElkResponse('0000000000000\r\n');
        const matchingResponse = new ResponseClass(responseRaw || '0000000000000\r\n');
        const timeout = setTimeout(() => {
          classMock.emit('message', nonMatchingResponse);
          classMock.emit('message', matchingResponse);
        });
        const result = await (classMock[name] as (...args: any[]) => any)(...(commandArgs || []));
        expect(result).toBe(matchingResponse);
        expect(sendCommandMock).toBeCalledWith(expect.any(CommandClass), expect.anything());
        clearTimeout(timeout);
      });
    }
  );
});
