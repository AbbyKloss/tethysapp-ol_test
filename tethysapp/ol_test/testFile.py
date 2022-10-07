# import csv
# from math import log10, log2
import json
# from traceback import print_tb
import geopandas as gpd
import pandas as pd
# import time as t
from datetime import datetime
# import copy
import requests
# import cufflinks as cf
# import plotly.figure_factory as ff
# import numpy
# from django.http import JsonResponse
# from random import choice
# from sys import getsizeof as gso
# import reportlab
from io import BytesIO
import plotly.graph_objects as go
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import inch
from PIL import Image
import base64
import subprocess




# def create_hydrograph(hylakID: str, timespan="total", heightIn='520px', widthIn='100%'):
#     # Setup
#     time = []
#     flow = []
#     # headerOffset = 1 # an offset we can use to disregard the header if need be

#     file_path = "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/workspaces/app_workspace/files/HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
#     df = None
    
#     df = pd.read_csv(file_path, usecols=["Dates", hylakID])
#     data = df.copy()
#     data = data[~(data['Dates'] < "2010-01-01")]
#     data = data[~(data["Dates"] > "2010-12-31")]
    
#     flow = copy.deepcopy(data[hylakID].to_list())
#     time = copy.copy(list(set(data["Dates"].to_list())))

#     time = sorted([datetime.strptime(dt, "%Y-%m-%d") for dt in time])
#     time = [dt.strftime("%Y-%m-%d") for dt in time]
#     string = f"Dates, {hylakID}"
#     for i in range(len(time)):
#         string += f"{time[i]}, {flow[i]}\n"
#     print(string)
    
# # create_hydrograph("1500000")

def generatePlot(hylakID: int | str, timespan="total", graphScale = 6) -> BytesIO:
    timespan = timespan.lower()
    hylakID = str(hylakID)
    csvFilename= "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/workspaces/app_workspace/files/HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"
    df = pd.read_csv(csvFilename, usecols=["Dates", hylakID])

    if timespan == "daily":
        name = f"Daily Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%j")

        gb = df.groupby(["Dates"]).mean()

        flow = gb[hylakID].to_list()
        time = list(set(df["Dates"].to_list()))
        
        time = sorted([datetime.strptime(dt, "%j") for dt in time])
        time = [dt.strftime("%b-%d") for dt in time]

    elif timespan == "monthly":
        name = f"Monthly Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%m")

        gb = df.groupby(["Dates"]).mean()

        flow = gb[hylakID].to_list()
        time = list(set(df["Dates"].to_list()))

        time = sorted([datetime.strptime(dt, "%m") for dt in time])
        time = [dt.strftime("%b") for dt in time]

    elif timespan == "yearly":
        name = f"Yearly Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%Y")

        gb = df.groupby(["Dates"]).mean()

        flow = gb[hylakID].to_list()
        time = list(set(df["Dates"].to_list()))

        time = sorted([datetime.strptime(dt, "%Y") for dt in time])
        time = [dt.strftime("%Y") for dt in time]

    else:
        name = f"Hydrograph for {hylakID}"
        time = df["Dates"].astype(str).to_list()
        flow = df[hylakID].to_list()



    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=time,
        y=flow,
        name=name,
        line={'color': '#0080ff', 'width': 4, 'shape':'spline'},
    ))

    tempImage = BytesIO()

    fig.write_image(tempImage, format="png", scale=10, width=8*inch, height=graphScale*inch, validate=True)
    return tempImage

def createPDF (hylak_id: int | str):
    hylak_id = int(hylak_id)
    GeoJSONPath = "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/workspaces/app_workspace/files/HydroLakes/HydroLakes_polys_v10_10km2_Global_centroids/HydroLakes_polys_v10_10km2_Global_centroids.shp"
    input = json.loads(gpd.read_file(GeoJSONPath).to_json())['features']
    
    obj = {}

    # horribly retrieving the station properties
    for item in input:
        if item["properties"]["Hylak_id"] == hylak_id:
            obj = item
            break

    filename = "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/public/images/test.pdf"

    pdf = BytesIO()

    canv = canvas.Canvas(pdf, pagesize=letter)
    width, height = letter
    print(width, height, inch)
        
    canv.setLineWidth(.3)
    canv.setFont('Courier', 12)
    startPoint = 750
    coordLon, coordLat = 0, 0

    contents = ['Hylak_id', 'Lake_name', 'Country', 'Continent', 'Poly_src', 'Lake_type', 'Grand_id', 'Lake_area', 'Shore_len', 'Vol_total', 'Vol_res', 'Vol_src', 'Depth_avg', 'Dis_avg', 'Res_time', 'Elevation', 'Slope_100', 'Wshd_area', 'Pour_long', 'Pour_lat', 'coordinates']

    for props in obj:
        if ((props == "id") or (props == "type")):
            continue
        for item in obj[props]:
            if item in contents:
                if (item == "coordinates"):
                    coordLon, coordLat = obj[props][item]
                    canv.drawString(30, startPoint, f"Latitude: {coordLat}")
                    startPoint -= 15
                    canv.drawString(30, startPoint, f"Longitude: {coordLon}")

                else:
                    canv.drawString(30, startPoint, f"{item}: {obj[props][item]}")
                startPoint -= 15

    img = createImage(coordLon=coordLon, coordLat=coordLat)
    if img == None:
        print("Failed")
        return None
    imag = Image.open(img)

    graphScale = 5.25
    startPoint -= graphScale*inch - 10
    canv.drawImage(ImageReader(imag), 30, startPoint, width=graphScale*inch, height=graphScale*inch)


    timespans = ["total", "yearly", "monthly", "daily"]
    for span in timespans:
        img = generatePlot(hylakID=hylak_id, timespan=span, graphScale=graphScale)
        imag = Image.open(img)
        if (startPoint > (graphScale * inch) + 10):
            startPoint -= graphScale*inch - 10
        else:
            canv.showPage()
            startPoint = height - ((graphScale*inch) + 20)
        print(f"{span}: {startPoint}")
        canv.drawImage(ImageReader(imag), 30, startPoint, width=8*inch, height=graphScale*inch)
    canv.save()

    pdf.seek(0)
    readpdf = base64.b64encode(pdf.read())
    # decoded = readpdf.decode('utf8')
    print(readpdf, end="\n\n\n")
    # print(decoded)
    # subprocess.call(['open', "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/public/images/test.pdf"])

# createPDF(50)

def createImage(coordLon, coordLat):
    apiKey = "bfb2218b96154412815818def9d0c11f"
    payload = {
        "style": "osm-carto",
        "width": "600",
        "height": "600",
        "center": f"lonlat:{coordLon},{coordLat}",
        "zoom": "8.4",
        "marker": f"lonlat:{coordLon},{coordLat};color:%23ff0000;size:medium",
        "apiKey": apiKey
    }
    payload_str = "&".join(f"{key}={value}" for key, value in payload.items())

    url = 'https://maps.geoapify.com/v1/staticmap' + "?" + payload_str
    of = BytesIO()
    r = requests.get(url)
    if r.status_code == 200:
        for chunk in r:
            of.write(chunk)
        return of
    else:
        print(r.status_code)
        return None

# createImage(coordLon="-111.64493187082914", coordLat="57.07444159367067")
# createPDF("5550")

# lst = []
# lst.append(BytesIO(b'abcd').read())
# lst.append(BytesIO(b'defg').read())
# lst.append(BytesIO(b'ghij').read())

# print(type(lst))
# print(lst)


# data = "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"
lost = []
for i in range(20):
    lost.append(i)

for item in lost:
    print(item % 2)


# lat, lon = 35.23219678224656, 10.797268099945738

# payload = {
#     "style": "osm-carto",
#     "width": "600",
#     "height": "600",
#     "center": f"lonlat:{lon},{lat}",
#     "zoom": "8.4",
#     "marker": f"lonlat:{lon},{lat};color:%23ff0000;size:medium",
#     "apiKey": "bfb2218b96154412815818def9d0c11f"
#     }

# payload_str = "&".join(f"{key}={value}" for key, value in payload.items())

# url = 'https://maps.geoapify.com/v1/staticmap'

# savePath = "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/public/images/img.png"

# r = requests.get(url, params=payload_str)
# print(r.url)

# # print(r)
# if r.status_code == 200:
#     with open(savePath, "wb") as of:
#         for chunk in r:
#             of.write(chunk)
# else:
#     print(r.status_code)

# print("Done!")