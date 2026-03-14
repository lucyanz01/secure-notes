from src import create_app
from flask import send_from_directory, redirect
import os

app = create_app()

@app.route('/frontend/<path:filename>')
def frontend(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend'), filename)

@app.route('/')
def index():
    return redirect('/frontend/login.html')

if __name__ == "__main__":
    app.run(debug=True)