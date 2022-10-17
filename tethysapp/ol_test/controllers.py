import json
from .handlers import create_hydrograph, createCSV, createPDF
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect, ensure_csrf_cookie
from tethys_sdk.permissions import login_required
from .model import Station, get_all_stations
from .app import OlTest as app
import base64
from io import BytesIO

@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    # there's not much to control, admittedly
    # it's 90% javascript at this point
    context = {}

    return render(request, 'ol_test/home.html', context)


@login_required()
def load_GJSON(request):
    '''
    Creates the GeoJSON from the database and passes it to the client
    '''
    stations = get_all_stations()
    features = []

    # Define GeoJSON Features
    for station in stations:

        station_feature = {
            'id': station.Hylak_id,
            'type': 'Feature',
            'properties': {
                'Hylak_id': station.Hylak_id,
                'Lake_name': station.Lake_name,
                'Country': station.Country,
                'Continent': station.Continent,
                'Poly_src': station.Poly_src,
                'Lake_type': station.Lake_type,
                'Grand_id': station.Grand_id,
                'Lake_area': station.Lake_area,
                'Shore_len': station.Shore_len,
                'Vol_total': station.Vol_total,
                'Vol_res': station.Vol_res,
                'Vol_src': station.Vol_src,
                'Depth_avg': station.Depth_avg,
                'Dis_avg': station.Dis_avg,
                'Res_time': station.Res_time,
                'Elevation': station.Elevation,
                'Slope_100': station.Slope_100,
                'Wshd_area': station.Wshd_area,
                'Pour_long': station.Pour_long,
                'Pour_lat': station.Pour_lat,
                'layer': station.layer,
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [station.coordLon, station.coordLat],
            }            
        }
        features.append(station_feature)    
    
    # Package the GeoJSON, then send it
    response = {'type': 'FeatureCollection',
                'features': features
                }

    return JsonResponse(response, safe=False)


@login_required()
@csrf_protect
def hydrograph_ajax(request):
    """
    Controller for the Hydrograph Loaders.
    """
    # needs to be a post request
    if (request.method != "POST"):
        return HttpResponse(status = 400)
    
    # initializing data
    post = request.POST.dict()
    station_id, height, timespan, mode = "", "", "", 0

    # retrieving data from POST request
    try:
        station_id = post['hylak_id']
        height = post['height']
        timespan = post['timespan']
        mode = int(post['mode'])
    except KeyError:
        return HttpResponse(status = 400)

    # create graphs
    filename = "HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
    traces = create_hydrograph(station_id, filename, timespan=timespan, heightIn=height, mode=mode)


    context = {
        'data': traces,
    }

    # if mode is PlotlyView mode (aka popover/graph modal graphs), render it
    # otherwise, return the data as a JSON for plotly.js to handle
    if (mode == 1):
        return render(request, 'ol_test/hydrograph_ajax.html', context)
    else:
        return JsonResponse(context)

@csrf_protect
def update_feats(request):
    """
    Updates the coordinates of specific features based on an HttpRequest
    """
    # needs to be a POST request, GET wouldn't be secure
    if (request.method != "POST"):
        return HttpResponse(status = 400)

    # open database
    Session = app.get_persistent_store_database('primary_db', as_sessionmaker=True)
    session = Session()

    # update database with data from client
    data = request.POST.dict()
    station = session.query(Station).filter_by(Hylak_id=data['Hylak_id']).first()
    station.coordLon = data['coordLon']
    station.coordLat = data['coordLat']

    # close database, return "done"
    session.commit()
    session.close()
    return HttpResponse(status = 201)

@login_required()
def details(request, station_id):
    """
    Controller for the Details Page
    Fills in template with data from database based on Hylak_ID
    """

    session = app.get_persistent_store_database('primary_db', as_sessionmaker=True)()
    station = session.query(Station).filter_by(Hylak_id=station_id).first()

    location_set = [
        ["Continent", station.Continent],
        ["Country", station.Country],
        ["Lake Name", station.Lake_name],
        ["Latitude", station.coordLat],
        ["Longitude", station.coordLon],
        ["Elevation", station.Elevation],
        ["Pour Latitude", station.Pour_lat],
        ["Pour Longitude", station.Pour_long],
        ]

    size_set = [
        ["Lake Area", station.Lake_area],
        ["Watershed Area", station.Wshd_area],
        ["Reservoir Volume(?)", station.Vol_res],
        ["Source Volume", station.Vol_src],
        ["Total Volume", station.Vol_total],
        ["Average Depth", station.Depth_avg],
        ["Distance Average", station.Dis_avg],
    ]

    misc_set = [
        ["Hylak ID", station.Hylak_id],
        ["Grand ID", station.Grand_id],
        ["Polygon Source(?)", station.Poly_src],
        ["Lake Type", station.Lake_type],
        ["Reservoir Time(?)", station.Res_time],
        ["Shore Length", station.Shore_len],
        ["Slope 100", station.Slope_100],
    ]

    session.close()

    context = {
        'location_set': location_set,
        'size_set': size_set,
        'misc_set': misc_set,
    }

    return render(request, "ol_test/details.html", context)

def download_station_csv(request):
    '''
    Controller for client CSV requests
    Sends Client a CSV based on passed Hylak_ID
    '''
    # Requires GET request, POST would be excessive
    if (request.method != "GET"):
        print(request.method)
        return HttpResponse(status = 400)
    
    # initializing data
    get = request.GET.dict()
    station_id = ""

    # attempting to retrieve data
    try:
        station_id = get['hylak_id']
    except (KeyError, ValueError) as e:
        print(e)
        return HttpResponse(status = 400)
    
    # get csv data from original csv file
    filename = "HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
    file_data = createCSV(station_id, filename)

    # package the csv and return it
    response = HttpResponse(file_data, content_type='application/text charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{station_id}.csv"'

    return response

@csrf_protect
def pdf_ajax(request):
    '''
    Controller for client PDF requests
    Creates PDFs based on passed data and sends PDF to client
    '''
    # Requires it to be a POST request, not a GET request
    if (request.method != "POST"):
        print(request.method)
        return HttpResponse(status = 400)

    # initializing data
    post = request.POST.dict()
    station_id = ""

    # getting data from POST
    try:
        station_id = int(post['hylak_id'])
    except (KeyError, ValueError) as e:
        print(e)
        return HttpResponse(status = 400)    

    # converting the image data passed from the client into a useable image file in memory
    img_data = post['map_blob']
    img_data = base64.b64decode(img_data)
    img = BytesIO()
    img.write(img_data)
    img.seek(0)

    # Creating PDF
    file = createPDF(station_id, img)
    file.seek(0)

    # Sending PDF to Client
    response = FileResponse(file)
    response['Content-Disposition'] = f'attachment'
    response['Content-Type'] = 'application/pdf'
    return response