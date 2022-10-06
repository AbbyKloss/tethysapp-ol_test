from tethys_sdk.base import TethysAppBase, url_map_maker
from tethys_sdk.app_settings import PersistentStoreDatabaseSetting
from random import randint

def randColor(static=0) -> str:
    if (static == 1): # nice pink
        return '#f5a9b8'
    elif (static == 2): # mint green
        return '#73e69e'
    elif (static == 3): # nice teal
        return '#87DCBB'
    r = lambda: randint(0,255)
    colString = '#%02X%02X%02X' % (r(),r(),r())
    print(f"OLTest's color: {colString}")
    return colString

class OlTest(TethysAppBase):
    """
    Tethys app class for OL Test.
    """

    name = 'OL Test'
    index = 'ol_test:home'
    icon = 'ol_test/images/icon.gif'
    package = 'ol_test'
    root_url = 'ol-test'
    color = randColor()
    description = ''
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='ol-test',
                controller='ol_test.controllers.home'
            ),
            UrlMap(
                name='load_GJSON',
                url='ol-test/load_GJSON',
                controller='ol_test.controllers.load_GJSON'
            ),
            UrlMap(
                name='hydrograph_ajax',
                url='ol-test/hydrographs/ajax/',
                controller='ol_test.controllers.hydrograph_ajax'
            ),
            UrlMap(
                name='update_feats',
                url='ol-test/update_feats/',
                controller='ol_test.controllers.update_feats'
            ),
            UrlMap(
                name='details',
                url='ol-test/details/{station_id}',
                controller='ol_test.controllers.details'
            ),
            UrlMap(
                name="download_station_csv",
                url='ol-test/download_station_csv/',
                controller='ol_test.controllers.download_station_csv'
            ),
            UrlMap(
                name='pdf_ajax',
                url='ol-test/pdf/ajax/',
                controller='ol_test.controllers.pdf_ajax'
            ),
        )

        return url_maps

    def persistent_store_settings(self):
        """
        Define Persistent Store Settings.
        """
        ps_settings = (
            PersistentStoreDatabaseSetting(
                name='primary_db',
                description='primary database',
                initializer='ol_test.model.init_primary_db',
                required=True
            ),
        )

        return ps_settings
