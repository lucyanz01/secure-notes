from src import create_app
from flask import send_from_directory

app = create_app()

@app.route('/frontend/<path:filename>')
def frontend(filename):
    return send_from_directory('frontend', filename)

if __name__ == "__main__":
    app.run(debug=True)