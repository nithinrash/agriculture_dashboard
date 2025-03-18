
// Gauge configuration and creation functions
const baseGaugeOptions = {
    angle: 0,
    lineWidth: 0.44,
    radiusScale: 1,
    pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color: '#000000'
    },
    limitMax: false,
    limitMin: false,
    strokeColor: '#E0E0E0',
    generateGradient: true,
    highDpiSupport: true,
};

const createTemperatureGauge = (element) => {
    const tempGauge = new Gauge(element);
    const tempOptions = {
        ...baseGaugeOptions,
        lineWidth: 0.25,
        radiusScale: 0.8,
        pointer: {
            length: 0.8,
            strokeWidth: 0.035,
            color: '#dc3545'
        },
        staticLabels: {
            font: "12px sans-serif",
            labels: [0, 10, 20, 30, 40, 50]
        },
        staticZones: [
            {strokeStyle: "#3498db", min: 0, max: 15},
            {strokeStyle: "#2ecc71", min: 15, max: 25},
            {strokeStyle: "#e74c3c", min: 25, max: 50}
        ],
        maxValue: 50,
        minValue: 0,
        renderTicks: {
            divisions: 5,
            divWidth: 1.1,
            divLength: 0.7,
            divColor: '#333333',
            subDivisions: 3,
            subLength: 0.5,
            subWidth: 0.6,
            subColor: '#666666'
        }
    };
    
    tempGauge.setOptions(tempOptions);
    return tempGauge;
};

const createHumidityGauge = (element) => {
    const humidityGauge = new Gauge(element);
    const humidityOptions = {
        ...baseGaugeOptions,
        angle: -0.25,
        lineWidth: 0.2,
        radiusScale: 0.9,
        pointer: {
            length: 0.6,
            strokeWidth: 0.05,
            color: '#000000'
        },
        staticLabels: {
            font: "12px sans-serif",
            labels: [0, 20, 40, 60, 80, 100]
        },
        staticZones: [
            {strokeStyle: "#e74c3c", min: 0, max: 30},
            {strokeStyle: "#f1c40f", min: 30, max: 60},
            {strokeStyle: "#2ecc71", min: 60, max: 100}
        ],
        maxValue: 100,
        minValue: 0
    };
    
    humidityGauge.setOptions(humidityOptions);
    return humidityGauge;
};

const createMoistureGauge = (element) => {
    const moistureGauge = new Gauge(element);
    const moistureOptions = {
        ...baseGaugeOptions,
        angle: 0.15,
        lineWidth: 0.1,
        radiusScale: 0.8,
        pointer: {
            length: 0.5,
            strokeWidth: 0.045,
            color: '#000000'
        },
        staticLabels: {
            font: "12px sans-serif",
            labels: [0, 20, 40, 60, 80, 100]
        },
        staticZones: [
            {strokeStyle: "#e74c3c", min: 0, max: 30, strokeWidth: 0.3},
            {strokeStyle: "#f1c40f", min: 30, max: 70, strokeWidth: 0.3},
            {strokeStyle: "#2ecc71", min: 70, max: 100, strokeWidth: 0.3}
        ],
        maxValue: 100,
        minValue: 0
    };
    
    moistureGauge.setOptions(moistureOptions);
    return moistureGauge;
};
