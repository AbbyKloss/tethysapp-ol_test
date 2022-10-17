from .app import OlTest as app

# previously this file had everything from .handlers
# something happened that caused circular imports, so now they're separate

def get_workspace():
    """
    Returns the file path of the application's workspace directory.
    """
    app_workspace = app.get_app_workspace().path
    return app_workspace

