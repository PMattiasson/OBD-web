const modeCurrentData = '01';
const responsePIDs = [
    {
        name: 'EngineRPM',
        description: 'Engine RPM',
        PID: '0C',
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
        name: 'VehicleSpeed',
        description: 'Vehicle speed',
        PID: '0D',
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
        name: 'CoolantTemperature',
        description: 'Engine coolant temperature',
        PID: '05',
        mode: modeCurrentData,
        dataBytes: 1,
        unit: '°C',
        scale: 1,
        offset: -40,
        min: -40,
        max: 215,
        value: 0,
    },
];

export default responsePIDs;
