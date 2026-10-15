from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Demo data only. Real stick hardware is not connected.
stick_data = {
    "stick_id": "",
    "bluetooth_connected": False,
    "obstacle_distance": None,
    "water_detected": None,
    "battery": None,
    "location": None,
}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/stick", methods=["GET"])
def get_stick_data():
    return jsonify(stick_data)


@app.route("/api/connect", methods=["POST"])
def connect_stick():
    data = request.get_json(silent=True) or {}
    stick_id = str(data.get("stick_id", "")).strip()

    if not stick_id:
        return jsonify({
            "success": False,
            "message": "Please enter a stick ID."
        }), 400

    # Demo only: this saves the ID.
    # It does not establish a real Bluetooth connection.
    stick_data["stick_id"] = stick_id

    return jsonify({
        "success": True,
        "message": "Stick ID saved. Bluetooth pairing is not implemented yet.",
        "stick": stick_data,
    })


@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.get_json(silent=True) or {}

    try:
        intensity = int(data.get("intensity", 60))
    except (ValueError, TypeError):
        return jsonify({"error": "Intensity must be a number."}), 400

    if not 0 <= intensity <= 100:
        return jsonify({"error": "Intensity must be between 0 and 100."}), 400

    settings = {
        "intensity": intensity,
        "obstacle_pattern": bool(data.get("obstacle_pattern", True)),
        "water_pattern": bool(data.get("water_pattern", True)),
    }

    # These settings are stored for the demo interface only.
    return jsonify({
        "success": True,
        "settings": settings,
        "message": "Demo settings saved; the stick has not been configured.",
    })


if __name__ == "__main__":
    app.run(debug=True)