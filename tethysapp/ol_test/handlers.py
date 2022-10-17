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
# it = 0

def create_hydrograph(hylakID: str, filename: str, timespan="total", heightIn='520', widthIn='100%', mode=0, graphScale = 5.25): # -> Tuple[PlotlyView, BytesIO]:
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
    plot_data = []
    itemList = []

    meanColor = '#005fa5' # '#003f5c' # '#0080ff'
    stdDevColor = '#ffa600'
    extremesColor = '#bc5090'
    
    # manipulate data if necessary
    # make all the data easy for plotly to read
    if timespan == "daily":
        name = f"Daily Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%j")

        gb = df.groupby(["Dates"])

        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%j") for dt in time])
        time = [dt.strftime("%b-%d") for dt in time]

        ymax = gb.max()[hylakID].to_list()
        yPosStdv = gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list()
        ymean = gb.mean()[hylakID].to_list()
        yNegStdv = gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list()
        ymin = gb.min()[hylakID].to_list()

        dumbDataList = [
            ["max", [time, ymax]],
            ["+σ", [time, yPosStdv]],
            ["mean", [time, ymean]],
            ["-σ", [time, yNegStdv]],
            ["min", [time, ymin]],
        ]

        maxDict = {
            "x": time,
            "y": ymax,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "max",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        posStdvDict = {
            "x": time,
            "y": yPosStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "+σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        meanDict = {
            "x": time,
            "y": ymean,
            "line": {'color': meanColor, 'width': 4, 'shape':'spline'},
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        negStdvDict = {
            "x": time,
            "y": yNegStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "-σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        minDict = {
            "x": time,
            "y": ymin,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "min",
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

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

        ymax = gb.max()[hylakID].to_list()
        yPosStdv = gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list()
        ymean = gb.mean()[hylakID].to_list()
        yNegStdv = gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list()
        ymin = gb.min()[hylakID].to_list()

        dumbDataList = [
            ["max", [time, ymax]],
            ["+σ", [time, yPosStdv]],
            ["mean", [time, ymean]],
            ["-σ", [time, yNegStdv]],
            ["min", [time, ymin]],
        ]

        maxDict = {
            "x": time,
            "y": ymax,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "max",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        posStdvDict = {
            "x": time,
            "y": yPosStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "+σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        meanDict = {
            "x": time,
            "y": ymean,
            "line": {'color': meanColor, 'width': 4, 'shape':'spline'},
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        negStdvDict = {
            "x": time,
            "y": yNegStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "-σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        minDict = {
            "x": time,
            "y": ymin,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "min",
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        def update_trace(trace, points, selector):
            print(trace)
            for item in trace:
                print(item)

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            hydrograph_go.on_click(update_trace)
            plot_data.append(hydrograph_go)
        


    elif timespan == "yearly":
        name = f"Yearly Hydrograph for {hylakID}"
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%Y")

        gb = df.groupby(["Dates"])

        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%Y") for dt in time])
        time = [dt.strftime("%Y") for dt in time]

        ymax = gb.max()[hylakID].to_list()
        yPosStdv = gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list()
        ymean = gb.mean()[hylakID].to_list()
        yNegStdv = gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list()
        ymin = gb.min()[hylakID].to_list()

        dumbDataList = [
            ["max", [time, ymax]],
            ["+σ", [time, yPosStdv]],
            ["mean", [time, ymean]],
            ["-σ", [time, yNegStdv]],
            ["min", [time, ymin]],
        ]

        maxDict = {
            "x": time,
            "y": ymax,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "max",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        posStdvDict = {
            "x": time,
            "y": yPosStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "+σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        meanDict = {
            "x": time,
            "y": ymean,
            "line": {'color': meanColor, 'width': 4, 'shape':'spline'},
            "name": "mean",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(stdDevColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        negStdvDict = {
            "x": time,
            "y": yNegStdv,
            "line": {'color': stdDevColor, 'width': 4, 'shape':'spline'},
            "name": "-σ",
            "fill": "tonexty",
            "fillcolor": f"rgba{str(ImageColor.getrgb(extremesColor + '80')).replace(' ','').replace('128', '0.5')}"
        }

        minDict = {
            "x": time,
            "y": ymin,
            "line": {'color': extremesColor, 'width': 4, 'shape':'spline'},
            "name": "min",
        }

        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            plot_data.append(hydrograph_go)

    else:
        name = f"Hydrograph for {hylakID}"
        time = df["Dates"].astype(str).to_list()
        flow = df[hylakID].to_list()

        dumbDataList = [
            ["mean", [time, flow]]
        ]

        simpleDict = {
            "x": time,
            "y": flow,
            "name": name,
            "line": {'color': meanColor, 'width': 4, 'shape':'spline'}, # #003f5c
        }
        itemList = [simpleDict]

        hydrograph_go = go.Scatter(**simpleDict)
        plot_data = [hydrograph_go]
    
    del df

    layout = {
        'xaxis':  {'title': 'Time (date)'},
        'yaxis':  {'title': 'Flow (rate)'},
        'height': int(heightIn),
    }

    figure = go.Figure(data = plot_data, layout = layout)

    if (mode == 2):
        layout['title'] =  name
        tempImage = BytesIO()

        figure.write_image(tempImage, format="png", scale=10, width=8*inch, height=graphScale*inch, validate=True)
        return tempImage

    elif (mode == 1):
        hydrograph_plot = PlotlyView(figure, height=heightIn, width=widthIn)
        return hydrograph_plot
    
    # print(hydrograph_plot)
    # itemList.reverse()
    return dumbDataList

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

def wordWrap(instr: str, maxLen: int) -> list:
    '''
    Splits the given string into a list of strings containing unbroken words with each string having a lower len than the given length.
    Example usage: wordWrap("A Lengthy Example String To Demonstrate", 10) -> ['A Lengthy', 'Example', 'String To', 'Demonstrate']
    '''
    strA = instr
    strB = ""
    strLstA = []
    strLstB = []
    BigList = []
    while (len(strA) > maxLen):
        # print(len(strA))
        strLstA = strA.split(" ")
        strLstB.insert(0, strLstA.pop())
        strA = " ".join(strLstA)
        strB = " ".join(strLstB)

    if (len(strB) > maxLen):
        BigList.append(strA)
        try:
            result = wordWrap(strB, maxLen)
            for item in result:
                if (item == ''):
                    continue
                BigList.append(item)
        except RecursionError:
            return [strB]
    else:
        BigList = [strA, strB]
    return BigList

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

    setlist = [["Location:", location_set], ["Size:", size_set], ["Misc:", misc_set]]

    cursorX = 30
    curCursor = 0
    diff = 0
    maxStrLen = 30
    for title, content in setlist:
        diff = height - cursorY
        canv.drawString(cursorX, cursorY, title)
        cursorY -= 15
        curCursor = cursorY
        cursorX += 15
        for item in content:
            curstr = f"{item[0]}: {item[1]}"
            if (len(curstr) > maxStrLen): # if the string is too long, word wrap it
                splitList = wordWrap(curstr, maxStrLen)
                canv.drawString(cursorX, cursorY, splitList[0])
                cursorY -= 15
                for item in splitList[1:]:
                    canv.drawString(cursorX + 15, cursorY, item)
                    cursorY -= 15
            else:
                canv.drawString(cursorX, cursorY, curstr)
                cursorY -= 15
            curCursor = cursorY
        cursorY -= 30
        if (cursorX != 45):
            cursorX = 30
            cursorY -= 15
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
        img = create_hydrograph(hylakID=hylak_id, filename=filename, timespan=span, graphScale=graphScale, pdf=True)
        imag = Image.open(img)
        if (cursorY > (graphScale * inch) + 10):
            cursorY -= graphScale*inch - 10
        else:
            canv.showPage()
            cursorY = height - ((graphScale*inch) + 20)
        canv.drawImage(ImageReader(imag), cursorX, cursorY, width=8*inch, height=graphScale*inch)
    

    canv.save()
    return outfile