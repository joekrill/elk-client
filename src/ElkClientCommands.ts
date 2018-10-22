import {
  AlarmByZoneReport,
  AlarmByZoneRequest,
  Arm,
  ArmingLevel,
  ArmingStatusReport,
  ArmingStatusRequest,
  AudioDataReply,
  AudioDataRequest,
  ControlOutputOff,
  ControlOutputOn,
  ControlOutputStatusReport,
  ControlOutputStatusRequest,
  ControlOutputToggle,
  CounterValueRead,
  CounterValueReply,
  CounterValueWrite,
  CustomValue,
  CustomValueRead,
  CustomValueReply,
  CustomValuesReadAll,
  CustomValueWrite,
  DayOfWeek,
  DisplayTextClearOption,
  DisplayTextOnScreen,
  ElkCommand,
  ElkResponse,
  FunctionKey,
  InsteonLightingDeviceProgrammed,
  InsteonLightingDeviceProgramRequest,
  InsteonLightingDeviceStatusReply,
  InsteonLightingDeviceStatusRequest,
  KeypadAreaAssigmentsRequest,
  KeypadAreaAssignments,
  KeypadFunctionKeyPressRequest,
  KeypadFunctionKeyStatusRequest,
  KeypadKeyChange,
  LightingDeviceDataReply,
  LightingDeviceStatusRequest,
  LogWriteType,
  MonthOfYear,
  Omnistat2Reply,
  Omnistat2Request,
  PlcDeviceControl,
  PlcDeviceOff,
  PlcDeviceOn,
  PlcDeviceStatusReply,
  PlcDeviceStatusRequest,
  PlcDeviceToggle,
  PlcFunctionCode,
  RealTimeClockDataReply,
  RealTimeClockDataRequest,
  RealTimeClockDataWrite,
  SpeakPhrase,
  SpeakWord,
  SystemLogDataReadRequest,
  SystemLogDataUpdate,
  SystemLogDataWriteRequest,
  SystemTroubleStatusReply,
  SystemTroubleStatusRequest,
  TaskActivation,
  TemperatureData,
  TemperatureDataRequest,
  TemperatureDeviceType,
  TemperatureReply,
  TemperatureRequest,
  TextDescriptionReply,
  TextDescriptionRequest,
  TextDescriptionType,
  ThermostatData,
  ThermostatDataRequest,
  ThermostatMode,
  ThermostatSet,
  ThermostatSetCoolSetPoint,
  ThermostatSetFan,
  ThermostatSetHeatSetPoint,
  ThermostatSetHold,
  ThermostatSetMode,
  ThermostatSetType,
  UserCode,
  UserCodeAreasReply,
  UserCodeAreasRequest,
  UserCodeChangeReply,
  UserCodeChangeRequest,
  UserCodeChangeType,
  VersionNumberReply,
  VersionNumberRequest,
  ZoneBypassReply,
  ZoneBypassRequest,
  ZoneDefinitionData,
  ZoneDefinitionRequest,
  ZonePartitionReport,
  ZonePartitionRequest,
  ZoneStatusReport,
  ZoneStatusRequest,
  ZoneTrigger,
  ZoneVoltageData,
  ZoneVoltageRequest,
  KeypadKey,
  KeypadFunctionKeyPressReply
} from 'elk-message';
import { EventEmitter } from 'events';
import ElkClientEvents from './ElkClientEvents';
import withTimeout from './withTimeout';

/**
 * An abstract client implementation of sending/receiving specific
 * messages from the Elk M1.
 *
 * This is just a way to declutter the client and separate out the
 * specific command implementations.
 */
abstract class ElkClientCommands extends EventEmitter implements ElkClientEvents {
  abstract async sendCommand(command: ElkCommand, timeout?: number): Promise<void>;
  abstract readonly defaultTimeout: number;

  /**
   * Waits for a response that matches the predicate provided and resolves when it
   * is found, or rejects if it is not found within the timeframe.
   */
  async waitForResponse(
    predicate: (response: ElkResponse) => boolean,
    timeoutMs = this.defaultTimeout
  ) {
    let messageListener: (response: ElkResponse) => void;

    return withTimeout<ElkResponse>(
      timeoutMs,
      new Promise<ElkResponse>(resolve => {
        messageListener = (responseToCheck: ElkResponse) => {
          if (predicate(responseToCheck)) {
            resolve(responseToCheck);
          }
        };
        this.on('message', messageListener);
      })
    )
      .catch(error => {
        this.removeListener('message', messageListener);
        throw error;
      })
      .then(result => {
        this.removeListener('message', messageListener);
        return result;
      });
  }

  /**
   * Waits for an "OK" response and resolves when it is found, or rejects if it is not found within the
   * timeout time.
   */
  async waitForOk(timeoutMs = this.defaultTimeout) {
    let okListener: () => void;

    return withTimeout<ElkResponse>(
      timeoutMs,
      new Promise<ElkResponse>(resolve => {
        okListener = () => resolve();
        this.on('ok', okListener);
      })
    )
      .catch(error => {
        this.removeListener('ok', okListener);
        throw error;
      })
      .then(result => {
        this.removeListener('ok', okListener);
        return result;
      });
  }

  /**
   * Sends a command and waits for a {@link ElkResponse}
   * @param command The command to send
   * @param predicate A predicate function that is called for *every* response that
   *   is recevied and should return true when a response matches an expected
   *   response to the command that was sent.
   * @param timeout How long to wait for the response before rejecting.
   */
  async sendCommandForResponse(
    command: ElkCommand,
    predicate: (response: ElkResponse) => boolean,
    timeoutMs = this.defaultTimeout
  ): Promise<ElkResponse> {
    // We want the timeout to apply to the entire operation, so the whole promise
    // chain gets wrapped in a `withTimeout` and `waitForResponse` is told not to timeout.
    // Otherwise we'd have to determine how much of our timeout we have left to wait
    // for the response after we sent the command.
    return withTimeout<ElkResponse>(
      timeoutMs,
      this.sendCommand(command, timeoutMs).then(() => this.waitForResponse(predicate, 0))
    );
  }

  /**
   * Helper method for sending a command and waiting for an "OK" response.
   */
  async sendCommandForOk(command: ElkCommand, timeoutMs = this.defaultTimeout) {
    // Same as above:
    // We want the timeout to apply to the entire operation, so the whole promise
    // chain gets wrapped in a `withTimeout` and `waitForResponse` is told not to timeout.
    // Otherwise we'd have to determine how much of our timeout we have left to wait
    // for the response after we sent the command.
    return withTimeout<ElkResponse>(
      timeoutMs,
      this.sendCommand(command, timeoutMs).then(() => this.waitForOk(0))
    );
  }

  /**
   * Helper method for sending a command and waiting for a response that matches the
   * type of response class given.
   *
   * Useful for commands that only need to check the type of response message, and not
   * any of it's underlying data.
   */
  async sendCommandForResponseType<T extends ElkResponse>(
    command: ElkCommand,
    ResponseClass: Function
  ) {
    return this.sendCommandForResponse(
      command,
      message => message instanceof ResponseClass
    ) as Promise<T>;
  }

  async arm(areaNumber: number, armingLevel: ArmingLevel, userCode: string) {
    return this.sendCommand(new Arm(armingLevel, areaNumber, userCode), this.defaultTimeout);
  }

  async disarm(areaNumber: number, userCode: string) {
    return this.arm(areaNumber, ArmingLevel.Disarm, userCode);
  }

  async getArmingStatus(): Promise<ArmingStatusReport> {
    return this.sendCommandForResponseType<ArmingStatusReport>(
      new ArmingStatusRequest(),
      ArmingStatusReport
    );
  }

  async getAlarmsByZone() {
    return this.sendCommandForResponseType<AlarmByZoneReport>(
      new AlarmByZoneRequest(),
      AlarmByZoneReport
    );
  }

  async getAudioData(zoneNumber: number) {
    return this.sendCommandForResponse(
      new AudioDataRequest(zoneNumber),
      message => message instanceof AudioDataReply && message.zone === zoneNumber
    ) as Promise<AudioDataReply>;
  }

  async setControlOutputOff(outputNUmber: number) {
    return this.sendCommand(new ControlOutputOff(outputNUmber), this.defaultTimeout);
  }

  async setControlOutputOn(outputNUmber: number) {
    return this.sendCommand(new ControlOutputOn(outputNUmber), this.defaultTimeout);
  }

  async toggleControlOutput(outputNumber: number) {
    return this.sendCommand(new ControlOutputToggle(outputNumber), this.defaultTimeout);
  }

  async getControlOutputStatus() {
    return this.sendCommandForResponseType<ControlOutputStatusReport>(
      new ControlOutputStatusRequest(),
      ControlOutputStatusReport
    );
  }

  async getCustomValue(valueNumber: number) {
    return this.sendCommandForResponse(
      new CustomValueRead(valueNumber),
      message => message instanceof CustomValueReply && message.valueNumber === valueNumber
    ) as Promise<CustomValueReply>;
  }

  async getCustomValues() {
    return this.sendCommandForResponse(
      new CustomValuesReadAll(),
      message => message instanceof CustomValueReply && message.valueNumber === 0
    ) as Promise<CustomValueReply>;
  }

  async setCustomValue(valueNumber: number, value: CustomValue) {
    return this.sendCommandForResponse(
      new CustomValueWrite(valueNumber, value),
      message => message instanceof CustomValueReply && message.valueNumber === valueNumber
    ) as Promise<CustomValueReply>;
  }

  async changeUserCode(
    userNumber: number,
    masterOrCurrentUserCode: string | UserCode,
    newUserCode: string | UserCode,
    areaNumbers?: number[] | undefined,
    changeType?: UserCodeChangeType
  ) {
    return this.sendCommandForResponse(
      new UserCodeChangeRequest(
        userNumber,
        masterOrCurrentUserCode,
        newUserCode,
        areaNumbers,
        changeType
      ),
      message => message instanceof UserCodeChangeReply && message.userCode === userNumber
    ) as Promise<UserCodeChangeReply>;
  }

  async getCounterValue(counterNumber: number) {
    return this.sendCommandForResponse(
      new CounterValueRead(counterNumber),
      message => message instanceof CounterValueReply && message.counterNumber === counterNumber
    ) as Promise<CounterValueReply>;
  }

  async setCounterValue(counterNumber: number, value: number) {
    return this.sendCommandForResponse(
      new CounterValueWrite(counterNumber, value),
      message => message instanceof CounterValueReply && message.counterNumber === counterNumber
    ) as Promise<CounterValueReply>;
  }

  async displayTextOnScreen(
    areaNumber: number,
    firstLine?: string | null,
    secondLine?: string | null,
    clearOption?: DisplayTextClearOption,
    beep?: boolean,
    timeout?: number
  ) {
    return this.sendCommand(
      new DisplayTextOnScreen(areaNumber, firstLine, secondLine, clearOption, beep, timeout),
      this.defaultTimeout
    );
  }

  async clearTextOnScreen(areaNumber: number, beep?: boolean) {
    return this.displayTextOnScreen(areaNumber, null, null, DisplayTextClearOption.Clear, beep);
  }

  async getLightingDeviceStatus(lightingDeviceNumber: number) {
    return this.sendCommandForResponse(
      new LightingDeviceStatusRequest(lightingDeviceNumber),
      message =>
        message instanceof LightingDeviceDataReply &&
        message.lightingDeviceNumber === lightingDeviceNumber
    ) as Promise<LightingDeviceDataReply>;
  }

  async getInsteonLightingDeviceStatus(startingDeviceNumber: number, deviceCount: number) {
    return this.sendCommandForResponse(
      new InsteonLightingDeviceStatusRequest(startingDeviceNumber, deviceCount),
      message =>
        message instanceof InsteonLightingDeviceStatusReply &&
        message.startingDeviceNumber === startingDeviceNumber &&
        message.deviceCount === deviceCount
    ) as Promise<InsteonLightingDeviceStatusReply>;
  }

  async setInsteaonLightingDevice(startingDeviceNumber: number, deviceIds: string[]) {
    return this.sendCommandForResponse(
      new InsteonLightingDeviceProgramRequest(startingDeviceNumber, deviceIds),
      message =>
        message instanceof InsteonLightingDeviceProgrammed &&
        message.startingDeviceNumber === startingDeviceNumber &&
        message.deviceCount === deviceIds.length
    ) as Promise<InsteonLightingDeviceProgrammed>;
  }

  async getKeypadAreaAssignments() {
    return this.sendCommandForResponseType<KeypadAreaAssignments>(
      new KeypadAreaAssigmentsRequest(),
      KeypadAreaAssignments
    );
  }

  async getKeypadFunctionKeyStatus(keypadNumber: number) {
    return this.sendCommandForResponse(
      new KeypadFunctionKeyStatusRequest(keypadNumber),
      message => message instanceof KeypadKeyChange && message.keypadNumber === keypadNumber
    ) as Promise<KeypadKeyChange>;
  }

  async pressKeypadFunctionKey(keypadNumber: number, functionKey: FunctionKey = FunctionKey.None) {
    return this.sendCommandForResponse(
      new KeypadFunctionKeyPressRequest(keypadNumber, functionKey),
      message =>
        message instanceof KeypadFunctionKeyPressReply &&
        message.keypadNumber === keypadNumber &&
        message.functionKey === functionKey
    ) as Promise<KeypadKeyChange>;
  }

  async getSystemLogData(logIndex: number) {
    return this.sendCommandForResponse(
      new SystemLogDataReadRequest(logIndex),
      message => message instanceof SystemLogDataUpdate && message.logIndex === logIndex
    ) as Promise<SystemLogDataUpdate>;
  }

  async writeSystemLogData(
    logType: LogWriteType,
    eventType: number,
    zoneNumber: number,
    areaNumber: number
  ) {
    return this.sendCommandForOk(
      new SystemLogDataWriteRequest(logType, eventType, zoneNumber, areaNumber)
    );
  }

  async getTemperatureData() {
    return this.sendCommandForResponseType<TemperatureData>(
      new TemperatureDataRequest(),
      TemperatureData
    );
  }

  async setPlcDevice(
    houseCode: string,
    unitCode: number,
    functionCode: PlcFunctionCode,
    extendedCode: number,
    onTime: number
  ) {
    return this.sendCommand(
      new PlcDeviceControl(houseCode, unitCode, functionCode, extendedCode, onTime),
      this.defaultTimeout
    );
  }

  async setPlcDeviceOff(houseCode: string, unitCode: number) {
    return this.sendCommand(new PlcDeviceOff(houseCode, unitCode), this.defaultTimeout);
  }

  async setPlcDeviceOn(houseCode: string, unitCode: number) {
    return this.sendCommand(new PlcDeviceOn(houseCode, unitCode), this.defaultTimeout);
  }

  async togglePlcDevice(houseCode: string, unitCode: number) {
    return this.sendCommand(new PlcDeviceToggle(houseCode, unitCode), this.defaultTimeout);
  }

  async getPlcStatus(bank: number) {
    return this.sendCommandForResponse(
      new PlcDeviceStatusRequest(bank),
      message => message instanceof PlcDeviceStatusReply && message.bank === bank
    ) as Promise<PlcDeviceStatusReply>;
  }

  async getRealTimeClock() {
    return this.sendCommandForResponseType<RealTimeClockDataReply>(
      new RealTimeClockDataRequest(),
      RealTimeClockDataReply
    );
  }

  async setRealTimeClock(
    year: number,
    month: MonthOfYear,
    day: number,
    dayOfWeek: DayOfWeek,
    hour: number,
    minutes: number,
    seconds: number
  ) {
    return this.sendCommandForResponseType<RealTimeClockDataReply>(
      new RealTimeClockDataWrite(year, month, day, dayOfWeek, hour, minutes, seconds),
      RealTimeClockDataReply
    );
  }

  async getDescription(textType: TextDescriptionType, address: number) {
    // The TextDescriptionType request will not always return the address requested:
    // > If the first character in a requested name is a “space” or less, then the
    // > next names are searched until a name is found whose first character is
    // > greater than “space” or the “Show On Keypad” bit is set.
    // So we just wait for ANY `TextDescriptionReply` response. This is not ideal
    // but I'm not sure what the alternative is.
    return this.sendCommandForResponseType<TextDescriptionReply>(
      new TextDescriptionRequest(textType, address),
      TextDescriptionReply
    );
  }

  async getTroubleStatus() {
    return this.sendCommandForResponseType<SystemTroubleStatusReply>(
      new SystemTroubleStatusRequest(),
      SystemTroubleStatusReply
    );
  }

  async getTemperature(deviceType: TemperatureDeviceType, deviceNumber: number) {
    return this.sendCommandForResponse(
      new TemperatureRequest(deviceType, deviceNumber),
      message =>
        message instanceof TemperatureReply &&
        message.deviceType === deviceType &&
        message.deviceNumber === deviceNumber
    ) as Promise<TemperatureReply>;
  }

  async speakWord(wordNumber: number) {
    return this.sendCommand(new SpeakWord(wordNumber), this.defaultTimeout);
  }

  async speakPhrase(phraseNumber: number) {
    return this.sendCommand(new SpeakPhrase(phraseNumber), this.defaultTimeout);
  }

  async activateTask(taskNumber: number) {
    return this.sendCommand(new TaskActivation(taskNumber), this.defaultTimeout);
  }

  async getThermostatData(thermostatNumber: number) {
    return this.sendCommandForResponse(
      new ThermostatDataRequest(thermostatNumber),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostat(thermostatNumber: number, value: number, element: ThermostatSetType) {
    return this.sendCommandForResponse(
      new ThermostatSet(thermostatNumber, value, element),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostatCoolSetPoint(thermostatNumber: number, temperature: number) {
    return this.sendCommandForResponse(
      new ThermostatSetCoolSetPoint(thermostatNumber, temperature),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostatHeatSetPoint(thermostatNumber: number, temperature: number) {
    return this.sendCommandForResponse(
      new ThermostatSetHeatSetPoint(thermostatNumber, temperature),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostatFan(thermostatNumber: number, on: boolean) {
    return this.sendCommandForResponse(
      new ThermostatSetFan(thermostatNumber, on),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostatMode(thermostatNumber: number, mode: ThermostatMode) {
    return this.sendCommandForResponse(
      new ThermostatSetMode(thermostatNumber, mode),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async setThermostatHold(thermostatNumber: number, on: boolean) {
    return this.sendCommandForResponse(
      new ThermostatSetHold(thermostatNumber, on),
      message => message instanceof ThermostatData && message.thermostatNumber === thermostatNumber
    ) as Promise<ThermostatData>;
  }

  async getOmnistat2Data(onmistatData: string) {
    return this.sendCommandForResponseType<Omnistat2Reply>(
      new Omnistat2Request(onmistatData),
      Omnistat2Reply
    );
  }

  async getVersionNumber(): Promise<VersionNumberReply> {
    return this.sendCommandForResponseType<VersionNumberReply>(
      new VersionNumberRequest(),
      VersionNumberReply
    );
  }

  async getValidUserCodeAreas(userCode: string) {
    return this.sendCommandForResponse(
      new UserCodeAreasRequest(userCode),
      message =>
        message instanceof UserCodeAreasReply && message.userCode === userCode.padStart(6, '0')
    ) as Promise<UserCodeAreasReply>;
  }

  async toggleBypassForZone(pinCode: string, zoneNumber: number) {
    return this.sendCommandForResponse(
      new ZoneBypassRequest(pinCode, zoneNumber),
      message => message instanceof ZoneBypassReply && message.zoneNumber === zoneNumber
    ) as Promise<ZoneBypassReply>;
  }

  async toggleBypassForArea(pinCode: string, areaNumber: number) {
    return this.sendCommandForResponse(
      new ZoneBypassRequest(pinCode, 0, areaNumber),
      message => message instanceof ZoneBypassReply && message.zoneNumber === 0
    ) as Promise<ZoneBypassReply>;
  }

  async getZonePartitions() {
    return this.sendCommandForResponseType<ZonePartitionReport>(
      new ZonePartitionRequest(),
      ZonePartitionReport
    );
  }

  async getZoneStatus() {
    return this.sendCommandForResponseType<ZoneStatusReport>(
      new ZoneStatusRequest(),
      ZoneStatusReport
    );
  }

  async getZoneDefinitions() {
    return this.sendCommandForResponseType<ZoneDefinitionData>(
      new ZoneDefinitionRequest(),
      ZoneDefinitionData
    );
  }

  async triggerZone(zoneNumber: number) {
    return this.sendCommand(new ZoneTrigger(zoneNumber), this.defaultTimeout);
  }

  async getZoneVoltage(zoneNumber: number) {
    return this.sendCommandForResponse(
      new ZoneVoltageRequest(zoneNumber),
      message => message instanceof ZoneVoltageData && message.zoneNumber === zoneNumber
    ) as Promise<ZoneVoltageData>;
  }
}

export default ElkClientCommands;
