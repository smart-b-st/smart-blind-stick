
document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const stickForm = $("stickForm");
    const stickIdInput = $("stickId");
    const codeScreen = $("codeScreen");
    const dashboard = $("dashboard");
    const formMessage = $("formMessage");

    const pages = ["homePage", "settingsPage", "findPage"];
    const navButtons = document.querySelectorAll(".nav-button");

    let currentStickId = "";
    let demoConnected = false;

    // Send a request to the Python Flask backend.
    async function postJSON(url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Request failed."
            );
        }

        return result;
    }

    // Show one app page and highlight its navigation button.
    function showPage(pageId) {
        pages.forEach((id) => {
            const page = $(id);
            if (page) page.hidden = id !== pageId;
        });

        navButtons.forEach((button) => {
            const active = button.dataset.page === pageId;
            button.classList.toggle("active", active);
            button.setAttribute("aria-current", active ? "page" : "false");
        });
    }

    // Update the demo connection display.
    function updateConnectionDisplay() {
        $("bluetoothStatus").textContent = demoConnected
            ? "Demo connected — not real Bluetooth"
            : "Not connected";

        $("bluetoothButton").textContent = demoConnected
            ? "Disconnect (Demo)"
            : "Connect (Demo)";

        $("deviceInfoConnection").textContent = demoConnected
            ? "Demo connected"
            : "Not connected";
    }

    // Enter a stick ID.
    stickForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const stickId = stickIdInput.value.trim();

        if (!stickId) {
            formMessage.textContent = "Please enter a stick ID.";
            return;
        }

        formMessage.textContent = "Saving stick ID...";

        try {
            const result = await postJSON("/api/connect", {
                stick_id: stickId
            });

            currentStickId = stickId;

            $("displayStickId").textContent = currentStickId;
            $("deviceInfoId").textContent = currentStickId;

            codeScreen.hidden = true;
            dashboard.hidden = false;

            demoConnected = false;
            updateConnectionDisplay();
            showPage("homePage");

            formMessage.textContent = "";
            console.log(result.message);
        } catch (error) {
            formMessage.textContent = error.message;
        }
    });

    // Change to a different stick ID.
    $("changeStickButton").addEventListener("click", () => {
        dashboard.hidden = true;
        codeScreen.hidden = false;
        stickIdInput.value = currentStickId;
        formMessage.textContent = "";
        demoConnected = false;
        updateConnectionDisplay();
    });

    // Dashboard, Settings, and Find My Stick navigation.
    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

    // Demo Bluetooth button: this does NOT pair a real device.
    $("bluetoothButton").addEventListener("click", () => {
        demoConnected = !demoConnected;
        updateConnectionDisplay();

        if (demoConnected) {
            alert(
                "Demo mode only.\n\n" +
                "No real Bluetooth device has been paired."
            );
        }
    });

    // Vibration intensity slider.
    $("intensity").addEventListener("input", () => {
        $("intensityValue").textContent = $("intensity").value + "%";
        $("settingsMessage").textContent = "";
    });

    // Save settings to the demo backend.
    $("saveSettingsButton").addEventListener("click", async () => {
        const settings = {
            intensity: Number($("intensity").value),
            obstacle_pattern: $("obstaclePattern").checked,
            water_pattern: $("waterPattern").checked
        };

        const button = $("saveSettingsButton");
        button.disabled = true;
        button.textContent = "Saving...";

        try {
            const result = await postJSON("/api/settings", settings);
            $("settingsMessage").textContent = result.message;
            $("settingsMessage").style.color = "#1769AA";
        } catch (error) {
            $("settingsMessage").textContent =
                "Could not save settings: " + error.message;
            $("settingsMessage").style.color = "#C0392B";
        } finally {
            button.disabled = false;
            button.textContent = "Save Settings";
        }
    });

    // Location refresh: show what the backend actually reports.
    $("refreshLocationButton").addEventListener("click", async () => {
        const button = $("refreshLocationButton");
        const message = $("locationMessage");

        button.disabled = true;
        button.textContent = "Checking...";
        message.textContent = "";

        try {
            const response = await fetch("/api/stick");
            if (!response.ok) {
                throw new Error("Could not retrieve stick data.");
            }

            const data = await response.json();

            if (data.location) {
                $("findLocationStatus").textContent =
                    "Location data is available.";
                $("findLocationCoordinates").textContent =
                    typeof data.location === "string"
                        ? data.location
                        : JSON.stringify(data.location);

                message.textContent =
                    "Showing the location reported by the backend.";
            } else {
                $("findLocationStatus").textContent =
                    "No stick GPS data available.";
                $("findLocationCoordinates").textContent =
                    "Latitude: --, Longitude: --";
                message.textContent =
                    "No GPS location has been received from the stick.";
            }
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Refresh Location";
        }
    });

    // Initial state.
    dashboard.hidden = true;
    codeScreen.hidden = false;
    showPage("homePage");
    updateConnectionDisplay();

    console.log("Smart Blind Stick interface loaded.");
});
