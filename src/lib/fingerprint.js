export const generateDeviceFingerprint = async () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        window.screen.colorDepth,
        window.screen.width + 'x' + window.screen.height,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
        !!window.indexedDB,
        typeof window.openDatabase !== 'undefined',
        navigator.cpuClass,
        navigator.platform,
        navigator.doNotTrack,
        navigator.plugins ? Array.from(navigator.plugins).map(p => p.name).join(',') : '',
        // Attempt canvas fingerprinting
        (() => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = "top";
                ctx.font = "14px 'Arial'";
                ctx.fillStyle = "#f60";
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = "#069";
                ctx.fillText("TestPlatform", 2, 15);
                ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                ctx.fillText("TestPlatform", 4, 17);
                return canvas.toDataURL();
            } catch (e) {
                return 'no-canvas';
            }
        })()
    ];

    const fingerprintString = components.join('|||');

    // Hash the string using SHA-256 for a stable short token
    const msgBuffer = new TextEncoder().encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const finalHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return finalHash;
};
