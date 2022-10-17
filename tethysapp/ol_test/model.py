import json
# import os
# import pandas as pd
import geopandas as gpd
from sqlalchemy import Column, Integer, Float, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from .helpers import get_workspace

from .app import OlTest as app

Base = declarative_base()

class Station(Base):
    """
    SQLAlchemy Dam DB Model
    """
    __tablename__ = "stations"

    # Columns
    id = Column(Integer, primary_key=True)
    Hylak_id = Column(Integer)
    Lake_name = Column(String)
    Country = Column(String)
    Continent = Column(String)
    Poly_src = Column(String)
    Lake_type = Column(Integer)
    Grand_id = Column(Float)
    Lake_area = Column(Float)
    Shore_len = Column(Float)
    Vol_total = Column(Float)
    Vol_res = Column(Float)
    Vol_src = Column(Float)
    Depth_avg = Column(Float)
    Dis_avg = Column(Float)
    Res_time = Column(Float)
    Elevation = Column(Float)
    Slope_100 = Column(Float)
    Wshd_area = Column(Float)
    Pour_long = Column(Float)
    Pour_lat = Column(Float)
    coordLon = Column(Float)
    coordLat = Column(Float)
    layer = Column(String)

def init_primary_db(engine, first_time):
    """
    Initializer for the primary database.
    """
    # Create all the tables
    Base.metadata.create_all(engine)

    # Add data
    if first_time:
        print("Initializing Database for OL_Test...")
        # Make session
        Session = sessionmaker(bind=engine)
        session = Session()

        # get and read the gjson, then take everything from there and add it to the database
        GeoJSONPath = get_workspace() + "/files/Hydrolakes/HydroLakes_polys_v10_10km2_Global_centroids/HydroLakes_polys_v10_10km2_Global_centroids.shp"
    
        input = json.loads(gpd.read_file(GeoJSONPath).to_json())['features']

        for i in range(len(input)):
            Hylak_id = input[i]['properties']['Hylak_id']
            Lake_name = input[i]['properties']['Lake_name']
            Country = input[i]['properties']['Country']
            Continent = input[i]['properties']['Continent']
            Poly_src = input[i]['properties']['Poly_src']
            Lake_type = input[i]['properties']['Lake_type']
            Grand_id = input[i]['properties']['Grand_id']
            Lake_area = input[i]['properties']['Lake_area']
            Shore_len = input[i]['properties']['Shore_len']
            Vol_total = input[i]['properties']['Vol_total']
            Vol_res = input[i]['properties']['Vol_res']
            Vol_src = input[i]['properties']['Vol_src']
            Depth_avg = input[i]['properties']['Depth_avg']
            Dis_avg = input[i]['properties']['Dis_avg']
            Res_time = input[i]['properties']['Res_time']
            Elevation = input[i]['properties']['Elevation']
            Slope_100 = input[i]['properties']['Slope_100']
            Wshd_area = input[i]['properties']['Wshd_area']
            Pour_long = input[i]['properties']['Pour_long']
            Pour_lat = input[i]['properties']['Pour_lat']
            coordLon = input[i]['geometry']['coordinates'][0]
            coordLat = input[i]['geometry']['coordinates'][1]
            layer = input[i]['properties']['layer']
            new_station = Station(
                Hylak_id = Hylak_id,
                Lake_name = Lake_name,
                Country = Country,
                Continent = Continent,
                Poly_src = Poly_src,
                Lake_type = Lake_type,
                Grand_id = Grand_id,
                Lake_area = Lake_area,
                Shore_len = Shore_len,
                Vol_total = Vol_total,
                Vol_res = Vol_res,
                Vol_src = Vol_src,
                Depth_avg = Depth_avg,
                Dis_avg = Dis_avg,
                Res_time = Res_time,
                Elevation = Elevation,
                Slope_100 = Slope_100,
                Wshd_area = Wshd_area,
                Pour_long = Pour_long,
                Pour_lat = Pour_lat,
                coordLon = coordLon,
                coordLat = coordLat,
                layer = layer
            )
            session.add(new_station)

        # Add the dams to the session, commit, and close
        session.commit()
        session.close()

def get_all_stations():
    """
    Get all persisted dams.
    """
    # Get connection/session to database
    Session = app.get_persistent_store_database('primary_db', as_sessionmaker=True)
    session = Session()

    # Query for all dam records
    stations = session.query(Station).all()
    session.close()

    return stations