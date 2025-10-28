from flask import request, jsonify
import os

@app.route("/verify", methods=["POST"])
def verify():
    print("\n--- DEBUGGING UPLOAD ---")
    print("Request content type:", request.content_type)
    print("request.files keys:", list(request.files.keys()))
    print("request.form keys:", list(request.form.keys()))

    # Show full dicts (for debugging)
    print("Full request.files:", request.files)
    print("Full request.form:", request.form)

    if not request.files:
        print("⚠️ No files received")
    if not request.form:
        print("⚠️ No form fields received")

    image = request.files.get("image")
    description = request.form.get("description")

    if not image or not description:
        print("❌ Missing image or description")
        return jsonify({
            "error": "Both image and description are required",
            "debug": {
                "files_received": list(request.files.keys()),
                "form_received": request.form.to_dict(),
                "content_type": request.content_type
            }
        }), 400

    print(f"✅ Received image: {image.filename}")
    print(f"✅ Received description: {description}")

    image_path = os.path.join("uploads", image.filename)
    image.save(image_path)

    result = {"similarity_score": 0.75, "result": "Match"}  # dummy response
    return jsonify(result)
