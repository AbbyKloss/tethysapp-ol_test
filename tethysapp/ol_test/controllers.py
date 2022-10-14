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

    context = {
    }

    return render(request, 'ol_test/home.html', context)


@login_required()
def load_GJSON(request):
    stations = get_all_stations()

    features = []

    # testHelper = choice(stations)
    # attributes = inspect.getmembers(testHelper, lambda a:not(inspect.isroutine(a)))
    # print([a for a in attributes if not((a[0].startswith('__') and a[0].endswith('__')) or a[0].startswith('_sa') or (a[0] == 'metadata') or (a[0] == 'registry'))])
    minVol = 0
    maxVol = 0

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
        # print(station.Vol_total)
        # if (station.Vol_total == None):
        #     curVol = minVol
        # else:
        #     curVol = float(station.Vol_total)
        # if (maxVol == 0):
        #     minVol = maxVol = curVol
        # if (maxVol < curVol):
        #     maxVol = curVol
        # if (minVol > curVol):
        #     minVol = curVol
    
    
    response = {'type': 'FeatureCollection',
                'features': features
                }
    
    print(f"minVol: {minVol} | maxVol: {maxVol}")

    return JsonResponse(response, safe=False)


@login_required()
@csrf_protect
def hydrograph_ajax(request):
    """
    Controller for the Hydrograph Loaders.
    """
    if (request.method != "POST"):
        return HttpResponse(status = 400)
    
    post = request.POST.dict()
    station_id, height, timespan = "", "", ""
    # print(post)
    try:
        station_id = post['hylak_id']
        height = post['height']
        timespan = post['timespan']
    except KeyError:
        return HttpResponse(status = 400)
    filename = "HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
    hydrograph_plot = create_hydrograph(station_id, filename, timespan=timespan, heightIn=height)[0]

    context = {
        'hydrograph_plot': hydrograph_plot,
    }

    return render(request, 'ol_test/hydrograph_ajax.html', context)

@csrf_protect
def update_feats(request):
    """
    Updates the coordinates of specific features based on an HttpRequest
    """
    if (request.method != "POST"):
        return HttpResponse(status = 400)
    Session = app.get_persistent_store_database('primary_db', as_sessionmaker=True)
    session = Session()

    data = request.POST.dict()
    station = session.query(Station).filter_by(Hylak_id=data['Hylak_id']).first()
    station.coordLon = data['coordLon']
    station.coordLat = data['coordLat']

    session.commit()
    session.close()
    return HttpResponse(status = 201)

@login_required()
def details(request, station_id):
    """
    Controller for the Details Page
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

    # location_img = None
    # response = HttpResponse

    # print(station.coordLon, station.coordLat)

    session.close()

    

    


    # /files/misc/img.png
    # url = "ol_test/images/img.png"
    # print(url)

    # Programmatic gathering of attributes and names
    # Perfect if you have multiple datasets, but we only have the one
    #   and we wanna display it nicely
    # attributes = inspect.getmembers(station, lambda a:not(inspect.isroutine(a)))
    # data_list = [a for a in attributes if not((a[0].startswith('__') and a[0].endswith('__')) or a[0].startswith('_sa') or (a[0] == 'metadata') or (a[0] == 'registry') or (a[0] == 'id') or (a[0] == 'layer'))]
    # print(data_list)

    # session.close()

    context = {
        'location_set': location_set,
        'size_set': size_set,
        'misc_set': misc_set,
    }

    return render(request, "ol_test/details.html", context)

def download_station_csv(request):
    print("download_station_csv")
    if (request.method != "GET"):
        print(request.method)
        return HttpResponse(status = 400)
    get = request.GET.dict()
    station_id = ""

    try:
        station_id = get['hylak_id']
    except (KeyError, ValueError) as e:
        print(e)
        return HttpResponse(status = 400)
    # get csv data
    filename = "HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
    file_data = createCSV(station_id, filename)

    # package the csv and return it
    response = HttpResponse(file_data, content_type='application/text charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{station_id}.csv"'

    return response

@csrf_protect
def pdf_ajax(request):
    print(request.headers)
    if (request.method != "POST"):
        print(request.method)
        return HttpResponse(status = 400)
    post = request.POST.dict()
    station_id = ""
    # print(post)
    # for key in post.keys():
    #     print(post[key])

    try:
        station_id = int(post['hylak_id'])
    except (KeyError, ValueError) as e:
        print(e)
        return HttpResponse(status = 400)    

    img_data = post['map_blob'] #.decode('UTF-8')
    img_data = base64.b64decode(img_data) #.decode('base64')
    # test = img_data.decode("UTF-8")
    # for i in range(len(test)):
    #     if test[i] != post['map_blob'][i]:
    #         print(f"{post['map_blob'][i]} | {test[i]}")
    # print(img_data)
    # img_data = img_data
    img = BytesIO()
    img.write(img_data)
    img.seek(0)

    name = f"{station_id}.pdf"

    file = createPDF(station_id, img)
    file.seek(0)
    # file = base64.b64encode(file.read()) # uncomment for button
    response = FileResponse(file, filename=name)
    # print(response)
    # response.set_headers()
    # response = HttpResponse(file, content_type=f'application/pdf; name="{name}"')
    response['Content-Disposition'] = f'attachment; filename="{name}"' # these
    response['Content-Type'] = 'application/pdf'                       # too
    # print("Sending PDF")
    return response