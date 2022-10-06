# import plotly.express as px
from .app import OlTest as app
# import time as t

def get_workspace():
    """
    Returns the file path of the application's workspace directory.

    """
    app_workspace = app.get_app_workspace().path
    return app_workspace

