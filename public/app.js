const authScreen = document.getElementById('auth-screen');
const statusScreen = document.getElementById('status-screen');
const pairingScreen = document.getElementById('pairing-screen');
const passcodeInput = document.getElementById('passcode');
const authButton = document.getElementById('auth-button');
const statusMessage = document.getElementById('status-message');
const reauthenticateButton = document.getElementById('reauthenticate-button');
const phoneNumberInput = document.getElementById('phone-number');
const requestCodeButton = document.getElementById('request-code-button');
const pairingCodeDisplay = document.getElementById('pairing-code');

let isAuthenticated = false;
let passcode = '';

authButton.addEventListener('click', authenticate);
reauthenticateButton.addEventListener('click', reauthenticate);
requestCodeButton.addEventListener('click', requestPairingCode);

function showScreen(screen) {
    authScreen.classList.add('hidden');
    statusScreen.classList.add('hidden');
    pairingScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

async function authenticate() {
    passcode = passcodeInput.value;
    const response = await fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-passcode': passcode },
    });

    if (response.ok) {
        isAuthenticated = true;
        checkStatus();
    } else {
        alert('Invalid passcode');
    }
}

async function checkStatus() {
    const response = await fetch('/health', {
        headers: { 'x-passcode': passcode }
    });
    const data = await response.json();

    if (data.status === 'healthy') {
        showScreen(statusScreen);
        statusMessage.textContent = data.message;
    } else {
        showScreen(pairingScreen);
    }
}

async function reauthenticate() {
    await fetch('/reset', { method: 'POST', headers: { 'x-passcode': passcode } });
    showScreen(pairingScreen);
}

async function requestPairingCode() {
    const phoneNumber = phoneNumberInput.value;
    const response = await fetch('/request-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-passcode': passcode },
        body: JSON.stringify({ phoneNumber })
    });

    if (response.ok) {
        const data = await response.json();
        pairingCodeDisplay.textContent = `Pairing Code: ${data.pairingCode}`;
        startStatusPolling();
    } else {
        alert('Failed to request pairing code');
    }
}

function startStatusPolling() {
    const pollingInterval = setInterval(async () => {
        const response = await fetch('/health', {
            headers: { 'x-passcode': passcode }
        });
        const data = await response.json();

        if (data.status === 'healthy') {
            clearInterval(pollingInterval);
            showScreen(statusScreen);
            statusMessage.textContent = data.message;
        }
    }, 5000);
}

// Initial check
if (!isAuthenticated) {
    showScreen(authScreen);
} else {
    checkStatus();
}