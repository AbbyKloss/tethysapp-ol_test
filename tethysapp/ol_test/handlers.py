# import csv
import pandas as pd
import numpy as np
from plotly import graph_objs as go
from datetime import datetime
from tethys_gizmos.gizmo_options import PlotlyView
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import inch
from PIL import Image, ImageColor
from .app import OlTest as app
from .helpers import get_workspace
from .model import Station

# an attempt to somewhat speed up the details page and creation of pdfs
# saves 4-5s when used well
glob_HID = 0
glob_df = None

def create_hydrograph(hylakID: str, filename: str, timespan="total", heightIn='520', widthIn='100%', pdf=False, graphScale = 5.25): # -> Tuple[PlotlyView, BytesIO]:
    """
    Generates a plotly view of a hydrograph.
    """

    # making sure variables are fine
    timespan = timespan.lower()
    hylakID = str(hylakID)

    global glob_HID
    global glob_df

    # get CSV or dataframe already in memory
    if (hylakID != glob_HID):
        glob_HID = hylakID
        file_path = get_workspace() + "/files/" + filename
        df = pd.read_csv(file_path, usecols=["Dates", hylakID])
        glob_df = df.copy()
    else:
        df = glob_df.copy()
    
    # prepare it for processing
    name = ""
    time = []
    flow = []
    
    # manipulate data if necessary
    # make all the data easy for plotly to read
    if timespan == "daily":
        name = f"Daily Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%j")

        gb = df.groupby(["Dates"])

        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%j") for dt in time])
        time = [dt.strftime("%b-%d") for dt in time]

        maxDict = {
            "x": time,
            "y": gb.max()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "max",
            # "stackgroup": "extremes"
            "fill": "tonexty"
        }

        posStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "+σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty"
        }

        meanDict = {
            "x": time,
            "y": gb.mean()[hylakID].to_list(),
            "line": {'color': '#003f5c', 'width': 4, 'shape':'spline'}, # 0080ff
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": 'rgba(255, 166, 0, 0.5)'
        }

        negStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "-σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty",
            "fillcolor": 'rgba(188, 80, 144, 0.5)'
        }

        minDict = {
            "x": time,
            "y": gb.min()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "min",
            # "stackgroup": "extremes"
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        plot_data = []

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            plot_data.append(hydrograph_go)
        

    elif timespan == "monthly":
        name = f"Monthly Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%m")

        gb = df.groupby(["Dates"])

        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%m") for dt in time])
        time = [dt.strftime("%b") for dt in time]

        # max = gb.max()
        # posStdv = gb.agg(lambda x: x.mean() + x.std())
        # mean = gb.mean()
        # negStdv = gb.agg(lambda x: x.mean() - x.std())
        # min = gb.min()

        maxDict = {
            "x": time,
            "y": gb.max()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "max",
            # "stackgroup": "extremes"
            "fill": "tonexty"
        }

        posStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "+σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty"
        }

        meanDict = {
            "x": time,
            "y": gb.mean()[hylakID].to_list(),
            "line": {'color': '#003f5c', 'width': 4, 'shape':'spline'}, # 0080ff
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": 'rgba(255, 166, 0, 0.5)'
        }

        negStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "-σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty",
            "fillcolor": 'rgba(188, 80, 144, 0.5)'
        }

        minDict = {
            "x": time,
            "y": gb.min()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "min",
            # "stackgroup": "extremes"
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        plot_data = []

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            plot_data.append(hydrograph_go)
        


    elif timespan == "yearly":
        name = f"Yearly Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%Y")

        gb = df.groupby(["Dates"])

        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%Y") for dt in time])
        time = [dt.strftime("%Y") for dt in time]

        maxDict = {
            "x": time,
            "y": gb.max()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "max",
            # "stackgroup": "extremes"
            "fill": "tonexty"
        }

        posStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "+σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty"
        }

        meanDict = {
            "x": time,
            "y": gb.mean()[hylakID].to_list(),
            "line": {'color': '#003f5c', 'width': 4, 'shape':'spline'}, # 0080ff
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": 'rgba(255, 166, 0, 0.5)'
        }

        negStdvDict = {
            "x": time,
            "y": gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list(),
            "line": {'color': '#ffa600', 'width': 4, 'shape':'spline'},
            "name": "-σ",
            # "stackgroup": "std_dev"
            "fill": "tonexty",
            "fillcolor": 'rgba(188, 80, 144, 0.5)'
        }

        minDict = {
            "x": time,
            "y": gb.min()[hylakID].to_list(),
            "line": {'color': '#bc5090', 'width': 4, 'shape':'spline'},
            "name": "min",
            # "stackgroup": "extremes"
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        plot_data = []

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            plot_data.append(hydrograph_go)

    else:
        name = f"Hydrograph for {hylakID}"
        time = df["Dates"].astype(str).to_list()
        flow = df[hylakID].to_list()

        hydrograph_go = go.Scatter(
            x=time,
            y=flow,
            name=name,
            line={'color': '#003f5c', 'width': 4, 'shape':'spline'}, # #0080ff
        )

        plot_data = [hydrograph_go]
    
    del df
    
    # Build up Plotly plot
    


    layout = {
        'title':  name,
        'xaxis':  {'title': 'Time (date)'},
        'yaxis':  {'title': 'Flow (rate)'},
        'height': int(heightIn),
    }
    
    figure = go.Figure(data = plot_data, layout = layout)

    tempImage = BytesIO()

    figure.write_image(tempImage, format="png", scale=10, width=8*inch, height=graphScale*inch, validate=True)
    # return tempImage


    hydrograph_plot = PlotlyView(figure, height=heightIn, width=widthIn)
    return hydrograph_plot, tempImage

def createCSV(hylakID: str, filename: str) -> str:
    # Get data from csv file
    file_path = get_workspace() + "/files/" + filename
    df = pd.read_csv(file_path, usecols=["Dates", hylakID])

    time = df["Dates"]
    flow = df[hylakID]

    # initializing the string we output
    outputString = f"Dates, {hylakID}\n"

    # outputting in a csv format
    for i in range(len(time)):
        outputString += f"{time[i]}, {flow[i]}\n"

    return outputString


def createPDF (hylak_id: int, img: BytesIO) -> BytesIO:
    # making sure input is fine
    hylak_id = int(hylak_id)
    filename = "HydroLakes/HydroLakes_polys_v10_10km2_global_results_dswe.csv"

    # opening database to get data from the base
    Session = app.get_persistent_store_database('primary_db', as_sessionmaker=True)
    session = Session()
    station = session.query(Station).filter_by(Hylak_id=hylak_id).first()
    session.close()

    # figure out how to make this go to the public filepath properly?
    # file = "/Users/chluser/tethysdev/tethysapp-ol_test/tethysapp/ol_test/public/images/test.pdf"
    # filename = "ol_test/public/images/test.pdf"

    outfile = BytesIO()

    canv = canvas.Canvas(outfile, pagesize=letter)
    width, height = letter
    # print(width, height, inch)
        
    canv.setLineWidth(.3)
    canv.setFont('Courier', 12)
    cursorY = 750

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

    setlist = [["Location:", location_set], ["Size:", size_set], ["Misc:",misc_set]]

    cursorX = 30
    curCursor = 0
    diff = 0
    for content in setlist:
        diff = height - cursorY
        canv.drawString(cursorX, cursorY, content[0])
        cursorY -= 15
        curCursor = cursorY
        for item in content[1]:
            canv.drawString(cursorX, cursorY, f"{item[0]}: {item[1]}")
            cursorY -= 15
            curCursor = cursorY
        cursorY -= 30
        if (setlist.index(content) % 2):
            cursorX = 30
        else:
            cursorY = height - diff
            cursorX = width // 2

    graphScale = 5.25
    cursorY = curCursor - 30
    cursorX = 30

    canv.drawString(cursorX, cursorY, f"Map Image:")

    cursorY = (curCursor + (graphScale * inch)) // 2


    # img = getImage(coordLon=station.coordLon, coordLat=station.coordLat)
    # if img == None:
    #     print("Failed to retrieve location image")
    # else:
    img.seek(0)
    test = BytesIO(img.read())
    imag = Image.open(test, formats=['png'])
    idealsiz = int(inch * graphScale)
    imwidth, imheight = imag.size
    if (imwidth != idealsiz and imheight != idealsiz):
        imag = imag.resize((idealsiz, idealsiz))
    # draw OSM location
    if (cursorY > (graphScale * inch) + 10):
        cursorY -= graphScale*inch - 10
    else:
        canv.showPage()
        cursorY = height - ((graphScale*inch) + 20)
    cursorX = (width - (graphScale * inch)) // 2
    canv.drawImage(ImageReader(imag), cursorX, cursorY, width=graphScale*inch, height=graphScale*inch)

    # draw all graphs
    cursorX = (width - (8 * inch))//2
    timespans = ["total", "yearly", "monthly", "daily"]
    for span in timespans:
        img = create_hydrograph(hylakID=hylak_id, filename=filename, timespan=span, graphScale=graphScale)[1]
        imag = Image.open(img)
        if (cursorY > (graphScale * inch) + 10):
            cursorY -= graphScale*inch - 10
        else:
            canv.showPage()
            cursorY = height - ((graphScale*inch) + 20)
        canv.drawImage(ImageReader(imag), cursorX, cursorY, width=8*inch, height=graphScale*inch)
    

    canv.save()
    return outfile