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
# saves 4-5s per pdf when used well
glob_HID = 0
glob_df = None

def create_hydrograph(hylakID: str, filename: str, timespan="total", heightIn='520', widthIn='100%', mode=0, graphScale = 5.25): # -> PlotlyView, list[list], BytesIO:
    """
    Generates hydrographs based on the mode variable.

    Parameters
    ----------
    hylakID: str
            The Hydro Lake to get information for
    filename: str
            The file from which to draw all the information
    timespan: str
            "total"   - The full historical data, no modifications
            "yearly"  - Compresses the data to a single point per year, adds statistical information
            "monthly" - Compresses the data to one point for every month (i.e. 12 points), adds statistical information
            "daily"   - Compresses the data to one point for every day represented in the data (similar to month's 12 points), adds statistical information
    heightIn: str
            sets the height in pixels for a PlotlyView graph. format is an int, but a string
    widthIn: str
            I think this is only used for the ajax use of PlotlyView. defaults to '100%' and there's little reason to change that
    mode: int
        mode default: returns just the data to build a hydrograph, in use on the details page
        mode = 1: returns a PlotlyView object to take care of building the graph, in use on the main page
        mode = 2: returns an image of the PlotlyView hydrograph via a BytesIO object
    graphScale: int
                defaults to 5.25, sets the general dimensions of the graph, namely for the pdfs

    Returns
    -------
    Depending on mode, list[str, list[list[str], list[float]]], PlotlyView(), or BytesIO, in that order
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
    # any and all processing that may need to be done
    name = ""
    time = []
    flow = []
    plot_data = []
    itemList = []
    fullDataList = []

    meanColor = '#005fa5' # '#003f5c' # '#0080ff'
    stdDevColor = '#ffa600'
    extremesColor = '#bc5090'
    
    # manipulate data if necessary
    # make all the data easy for plotly to read
    # make it rather tedious for a human to read (or write)
    # all of this data is used for most uses of this function, so this is truly necessary
    # i will just be commenting timespan=="daily" and the else statement, for my own sanity
    # each of the if statements are very similar with minor adjustments
    if timespan == "daily":
        # setup
        name = f"Daily Surface Area for {hylakID}"
        # condense the dates down to just the days of the year
        df["Dates"] = pd.to_datetime(df["Dates"], format="%Y-%m-%d").dt.strftime("%j")

        # condense the data as well
        gb = df.groupby(["Dates"])

        # convert the dates to something more readable
        # in this case, the format is [abbreviated month]-[date]
        time = list(set(df["Dates"].to_list()))
        time = sorted([datetime.strptime(dt, "%j") for dt in time])
        time = [dt.strftime("%b-%d") for dt in time]

        # put all of the statistical information into different lists so we can make different traces from each list
        ymax = gb.max()[hylakID].to_list()
        yPosStdv = gb.agg(lambda x: x.mean() + x.std())[hylakID].to_list()
        ymean = gb.mean()[hylakID].to_list()
        yNegStdv = gb.agg(lambda x: x.mean() - x.std())[hylakID].to_list()
        ymin = gb.min()[hylakID].to_list()

        # for mode=0, this is where it ends, everything after this is excessive
        fullDataList = [
            ["max", [time, ymax]],
            ["+σ", [time, yPosStdv]],
            ["mean", [time, ymean]],
            ["-σ", [time, yNegStdv]],
            ["min", [time, ymin]],
        ]

        # create dictionaries for each of the lists to easily pass data into the graph creation functions
        # makes it easier to read and adjust each value
        # these are all the exact same in each if statement
        # definitions for all of the keys are in Plotly documentation, look for graph_object.Scatter()
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

        # create the scatter plots and append them to a containing list, iteratively
        itemList = [maxDict, posStdvDict, meanDict, negStdvDict, minDict]

        for item in reversed(itemList):
            hydrograph_go = go.Scatter(**item)
            plot_data.append(hydrograph_go)
        

    elif timespan == "monthly":
        name = f"Monthly Surface Area for {hylakID}"
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

        fullDataList = [
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
        name = f"Yearly Surface Area for {hylakID}"
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

        fullDataList = [
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
        # set things up for go.Scatter()
        name = f"Historical Surface Area for {hylakID}"
        time = df["Dates"].astype(str).to_list()
        flow = df[hylakID].to_list()

        # for mode=0
        fullDataList = [
            ["mean", [time, flow]]
        ]

        # still easier to read like this than an expanded function, i feel
        simpleDict = {
            "x": time,
            "y": flow,
            "name": name,
            "line": {'color': meanColor, 'width': 4, 'shape':'spline'}, # #003f5c
        }

        hydrograph_go = go.Scatter(**simpleDict)
        plot_data = [hydrograph_go]
    
    # deletes the local dataframe, presumably saves some memory
    del df

    # modes 1 and 2 require this, so set it up here to not repeat code
    # it's just simple graph information, title, axis labels, graph height
    layout = {
        'title': name,
        'xaxis': {'title': 'Time (date)'},
        'yaxis': {'title': 'Surface Area (km²)'},
        'height': int(heightIn),
    }

    # create the figure for modes 1 and 2
    figure = go.Figure(data = plot_data, layout = layout)

    # create the image, return it
    if (mode == 2):
        tempImage = BytesIO()

        figure.write_image(tempImage, format="png", scale=10, width=8*inch, height=graphScale*inch, validate=True)
        return tempImage

    # create the PlotlyView object, return it
    elif (mode == 1):
        hydrograph_plot = PlotlyView(figure, height=heightIn, width=widthIn)
        return hydrograph_plot
    
    # default mode
    # return the data in a way that the client can read it
    return fullDataList

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

    # Split the string into two strings while the first strings has a high enough length
    while (len(strA) > maxLen):
        strLstA = strA.split(" ")
        strLstB.insert(0, strLstA.pop()) # takes the last item in the first list and puts it in the first place of the second list
        strA = " ".join(strLstA)
        strB = " ".join(strLstB)

    # if the second string list is too long, recursively run the while loop,
    # appending the consecutive strings to a bigger list along the way
    if (len(strB) > maxLen):
        # if the list is one word but it's too long, return the one word anyways
        if (strA == ""):
            return [strB]
        
        # put the good string on the list of strings
        BigList.append(strA)

        # recursively call wordWrap()
        result = wordWrap(strB, maxLen)

        # put all the resuls on the list of strings
        for item in result:
            BigList.append(item)
    # if both strings exist and are the right size, return them both
    elif (strB != ""):
        BigList = [strA, strB]
    # if the second string isn't real, just return the first
    else:
        BigList = [strA]
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
        img = create_hydrograph(hylakID=hylak_id, filename=filename, timespan=span, graphScale=graphScale, mode=2)
        imag = Image.open(img)
        if (cursorY > (graphScale * inch) + 10):
            cursorY -= graphScale*inch - 10
        else:
            canv.showPage()
            cursorY = height - ((graphScale*inch) + 20)
        canv.drawImage(ImageReader(imag), cursorX, cursorY, width=8*inch, height=graphScale*inch)
    

    canv.save()
    return outfile