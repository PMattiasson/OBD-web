const modeCurrentData = 1;
const responsePIDs = [
    {
        name: 'engineLoad',
        description: 'Calculated engine load',
        PID: 4,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: '%',
        scale: 100 / 255,
        offset: 0,
        min: 0,
        max: 100,
        value: 0,
    },
    {
        name: 'coolantTemperature',
        description: 'Engine coolant temperature',
        PID: 5,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: '°C',
        scale: 1,
        offset: -40,
        min: -40,
        max: 215,
        value: 0,
    },
    {
        name: 'fuelPressure',
        description: 'Fuel pressure',
        PID: 10,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: 'kPa',
        scale: 3,
        offset: 0,
        min: 0,
        max: 765,
        value: 0,
    },
    {
        name: 'engineRPM',
        description: 'Engine RPM',
        PID: 12,
        mode: modeCurrentData,
        dataBytes: 2,
        unit: 'rpm',
        scale: 0.25,
        offset: 0,
        min: 0,
        max: 16384,
        value: 0,
    },
    {
        name: 'vehicleSpeed',
        description: 'Vehicle speed',
        PID: 13,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: 'km/h',
        scale: 1,
        offset: 0,
        min: 0,
        max: 255,
        value: 0,
    },
    {
        name: 'intakeAirTemperature',
        description: 'Intake air temperature',
        PID: 15,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: '°C',
        scale: 1,
        offset: -40,
        min: -40,
        max: 215,
        value: 0,
    },
    {
        name: 'massAirFlow',
        description: 'Mass air flow rate',
        PID: 16,
        mode: modeCurrentData,
        dataBytes: 2,
        unit: 'g/s',
        scale: 0.01,
        offset: 0,
        min: 0,
        max: 655,
        value: 0,
    },
    {
        name: 'throttlePosition',
        description: 'Throttle position',
        PID: 17,
        mode: modeCurrentData,
        dataBytes: 1,
        unit: '%',
        scale: 100 / 255,
        offset: 0,
        min: 0,
        max: 100,
        value: 0,
    },
    {
        name: 'runTimeSinceEngineStart',
        description: 'Run time since engine start',
        PID: 31,
        mode: modeCurrentData,
        dataBytes: 2,
        unit: 's',
        scale: 1,
        offset: 0,
        min: 0,
        max: 65535,
        value: 0,
    },
];

export default responsePIDs;
