// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyARK3nDjmqVuDaAyixj3jkBSIIrjRb3dLM",
    authDomain: "agriculture-espnow.firebaseapp.com",
    databaseURL: "https://agriculture-espnow-default-rtdb.firebaseio.com",
    projectId: "agriculture-espnow",
    storageBucket: "agriculture-espnow.firebasestorage.app",
    messagingSenderId: "284327283088",
    appId: "1:284327283088:web:9886195d82792b92bf4b15"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global state
let currentSensor = 'home';
let connectionRef = null;

// DOM elements
const loadingOverlay = document.getElementById('loading-overlay');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const connectionStatus = document.getElementById('connection-status');
const sensorList = document.getElementById('sensor-list');

// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Add gauge initialization function with verification
const initializeGauge = (sensorId, type) => {
    const elementId = `${sensorId}-${type}-gauge`;
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error(`Cannot find gauge element: ${elementId}`);
        return null;
    }
    
    try {
        let gauge;
        switch(type) {
            case 'temperature':
                gauge = createTemperatureGauge(element);
                break;
            case 'humidity':
                gauge = createHumidityGauge(element);
                break;
            case 'moisture':
                gauge = createMoistureGauge(element);
                break;
            default:
                console.error(`Unknown gauge type: ${type}`);
                return null;
        }
        
        // Try to animate the gauge to make sure it's working
        gauge.set(0);
        return gauge;
    } catch (error) {
        console.error(`Error initializing ${type} gauge for ${sensorId}:`, error);
        return null;
    }
};

// Initialize gauges with validation
const gauges = {};
['n2', 'n3', 'n4'].forEach(sensorId => {
    gauges[sensorId] = {
        temperature: initializeGauge(sensorId, 'temperature'),
        humidity: initializeGauge(sensorId, 'humidity'),
        moisture: initializeGauge(sensorId, 'moisture')
    };
    console.log(`Initialized gauges for ${sensorId}:`, gauges[sensorId]);
});

// Function to reinitialize gauges for a specific sensor
const reinitializeGauges = (sensorId) => {
    console.log(`Reinitializing gauges for ${sensorId}`);
    
    // Force canvas redraw by cloning and replacing
    ['temperature', 'humidity', 'moisture'].forEach(type => {
        const canvasId = `${sensorId}-${type}-gauge`;
        const originalCanvas = document.getElementById(canvasId);
        
        if (originalCanvas) {
            // Create a new canvas
            const newCanvas = document.createElement('canvas');
            newCanvas.id = canvasId;
            newCanvas.width = originalCanvas.width;
            newCanvas.height = originalCanvas.height;
            
            // Replace the old canvas with the new one
            originalCanvas.parentNode.replaceChild(newCanvas, originalCanvas);
            
            // Initialize the new gauge
            let gauge;
            switch(type) {
                case 'temperature':
                    gauge = createTemperatureGauge(newCanvas);
                    break;
                case 'humidity':
                    gauge = createHumidityGauge(newCanvas);
                    break;
                case 'moisture':
                    gauge = createMoistureGauge(newCanvas);
                    break;
            }
            
            // Update the gauges object
            gauges[sensorId][type] = gauge;
        }
    });
    
    // Fetch the latest data and update the gauge
    database.ref(`/sensors/${sensorId}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateSensorGauges(sensorId, data);
        }
    });
};

// Show/hide loading overlay
const showLoading = () => loadingOverlay.classList.add('active');
const hideLoading = () => loadingOverlay.classList.remove('active');

// Show error modal
const showError = (message) => {
    errorMessage.textContent = message;
    errorModal.classList.add('active');
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
    connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
};

// Retry connection
window.retryConnection = () => {
    errorModal.classList.remove('active');
    connectToSensor(currentSensor);
};

// Update gauges for a specific sensor with better error handling
const updateSensorGauges = (sensorId, data) => {
    if (!data) {
        console.error(`No data provided for ${sensorId}`);
        return;
    }

    const temperature = data.t || 0;
    const humidity = data.h || 0;
    const moisture = data.s || 0;

    if (!gauges[sensorId]) {
        console.error(`No gauge object found for ${sensorId}`);
        return;
    }

    try {
        // Update temperature gauge
        if (gauges[sensorId].temperature) {
            gauges[sensorId].temperature.set(temperature);
            const tempElement = document.getElementById(`${sensorId}-temp`);
            if (tempElement) {
                tempElement.textContent = `${temperature.toFixed(1)}°C`;
            }
        } else {
            console.error(`Temperature gauge not initialized for ${sensorId}`);
        }

        // Update humidity gauge
        if (gauges[sensorId].humidity) {
            gauges[sensorId].humidity.set(humidity);
            const humidityElement = document.getElementById(`${sensorId}-humidity`);
            if (humidityElement) {
                humidityElement.textContent = `${humidity}%`;
            }
        } else {
            console.error(`Humidity gauge not initialized for ${sensorId}`);
        }

        // Update moisture gauge
        if (gauges[sensorId].moisture) {
            gauges[sensorId].moisture.set(moisture);
            const moistureElement = document.getElementById(`${sensorId}-moisture`);
            if (moistureElement) {
                moistureElement.textContent = `${moisture}%`;
            }
        } else {
            console.error(`Moisture gauge not initialized for ${sensorId}`);
        }
    } catch (error) {
        console.error(`Error updating gauges for ${sensorId}:`, error);
    }
};

// Separate functions for showing each sensor
const showAllSensors = () => {
    console.log("Showing all sensors (home view)");
    document.getElementById('all-sensors').style.display = 'block';
    document.querySelectorAll('.sensor-row').forEach(row => {
        row.style.display = 'block';
    });
};

const showSensorN2 = () => {
    console.log("Showing sensor N2");
    document.getElementById('all-sensors').style.display = 'block';
    document.querySelectorAll('.sensor-row').forEach(row => {
        row.style.display = 'none';
    });
    document.getElementById('sensor-n2').style.display = 'block';
};

const showSensorN3 = () => {
    console.log("Showing sensor N3");
    document.getElementById('all-sensors').style.display = 'block';
    document.querySelectorAll('.sensor-row').forEach(row => {
        row.style.display = 'none';
    });
    document.getElementById('sensor-n3').style.display = 'block';
};

const showSensorN4 = () => {
    console.log("Showing sensor N4");
    
    // Make sure all-sensors exists and is visible
    const allSensors = document.getElementById('all-sensors');
    if (allSensors) {
        allSensors.style.display = 'block';
    } else {
        console.error("all-sensors element not found");
    }
    
    // Hide all sensor rows first
    const sensorRows = document.querySelectorAll('.sensor-row');
    console.log(`Found ${sensorRows.length} sensor rows to hide`);
    sensorRows.forEach(row => {
        row.style.display = 'none';
    });
    
    // Show only sensor-n4
    const sensorN4 = document.getElementById('sensor-n4');
    if (sensorN4) {
        console.log("Found sensor-n4, setting to display:block");
        sensorN4.style.display = 'block';
        
        // Reinitialize the gauges for N4
        setTimeout(() => {
            reinitializeGauges('n4');
        }, 100);
    } else {
        console.error("sensor-n4 element not found");
        // Fallback: If we can't find n4 specifically, show all sensors
        sensorRows.forEach(row => {
            row.style.display = 'block';
        });
    }
};
// Connect to Firebase and listen for changes
const connectToSensor = (sensorId) => {
    showLoading();
    console.log(`Connecting to sensor: ${sensorId}`);

    // First remove any existing listeners
    if (connectionRef) {
        connectionRef.off();
    }

    if (sensorId === 'home') {
        // For home view, update all sensors
        const activeRefs = [];
        ['n2', 'n3', 'n4'].forEach(sensor => {
            const sensorRef = database.ref(`/sensors/${sensor}`);
            activeRefs.push(sensorRef);
            
            sensorRef.on('value', (snapshot) => {
                const data = snapshot.val();
                console.log(`Home view data for ${sensor}:`, data);
                
                if (data) {
                    updateSensorGauges(sensor, data);
                }
            }, (error) => {
                console.error(`Error getting data for ${sensor}:`, error);
            });
        });
        
        // Store active references to disconnect later
        connectionRef = { off: () => activeRefs.forEach(ref => ref.off()) };
        
        hideLoading();
        connectionStatus.classList.add('connected');
        connectionStatus.classList.remove('disconnected');
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
        return;
    }

    // For individual sensor view
    connectionRef = database.ref(`/sensors/${sensorId}`);
    connectionRef.on('value', (snapshot) => {
        hideLoading();
        const data = snapshot.val();
        console.log(`Individual sensor data for ${sensorId}:`, data);
        
        if (data) {
            updateSensorGauges(sensorId, data);
            connectionStatus.classList.add('connected');
            connectionStatus.classList.remove('disconnected');
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
        } else {
            console.error(`No data available for ${sensorId}`);
            showError('No data available for this sensor');
        }
    }, (error) => {
        console.error(`Firebase error for ${sensorId}:`, error);
        hideLoading();
        showError(`Error: ${error.message}`);
    });
};

// Connecting to specific sensors
const connectToN2 = () => {
    currentSensor = 'n2';
    showSensorN2();
    connectToSensor('n2');
};

const connectToN3 = () => {
    currentSensor = 'n3';
    showSensorN3();
    connectToSensor('n3');
};

const connectToN4 = () => {
    currentSensor = 'n4';
    showSensorN4();
    connectToSensor('n4');
};

const connectToHome = () => {
    currentSensor = 'home';
    showAllSensors();
    connectToSensor('home');
};

// Handle sensor navigation with improved separate functions
sensorList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const sensorId = e.target.getAttribute('data-sensor');
        console.log(`Selected sensor: ${sensorId}`);
        
        document.querySelectorAll('#sensor-list li').forEach(li => li.classList.remove('active'));
        e.target.classList.add('active');

        // Use dedicated functions for each sensor
        switch(sensorId) {
            case 'home':
                connectToHome();
                break;
            case 'n2':
                connectToN2();
                break;
            case 'n3':
                connectToN3();
                break;
            case 'n4':
                connectToN4();
                break;
            default:
                console.error(`Unknown sensor: ${sensorId}`);
        }
    }
});

// Handle toggle switches for all sensors
document.querySelectorAll('.sensor-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
        const sensorId = e.target.getAttribute('data-sensor');
        const controlValue = e.target.checked ? parseInt(sensorId.charAt(1)) : 0;
        database.ref('control').set(controlValue);
    });
});

// Update toggle states when control value changes
database.ref('control').on('value', (snapshot) => {
    const controlValue = snapshot.val();
    document.querySelectorAll('.sensor-toggle').forEach(toggle => {
        const sensorId = toggle.getAttribute('data-sensor');
        toggle.checked = (controlValue === parseInt(sensorId.charAt(1)));
    });
});

// Function to force redraw all gauges
window.forceRedrawAllGauges = () => {
    ['n2', 'n3', 'n4'].forEach(sensorId => {
        database.ref(`/sensors/${sensorId}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setTimeout(() => {
                    reinitializeGauges(sensorId);
                }, 200 * parseInt(sensorId.charAt(1))); // Stagger the reinitializations
            }
        });
    });
};

// Add window resize handler to fix gauge sizing issues
window.addEventListener('resize', () => {
    if (currentSensor !== 'home') {
        setTimeout(() => reinitializeGauges(currentSensor), 200);
    }
});

// Initial connection
connectToHome();

// Force a redraw of all gauges after a short delay to ensure DOM is ready
setTimeout(window.forceRedrawAllGauges, 1000);