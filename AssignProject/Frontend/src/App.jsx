import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";




const carIcon = new L.Icon({
  iconUrl: "https://images.vexels.com/media/users/3/154573/isolated/preview/bd08e000a449288c914d851cb9dae110-hatchback-car-top-view-silhouette-by-vexels.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const App = () => {
  const [route, setRoute] = useState([]);
  const [carPosition, setCarPosition] = useState([37.7749, -122.4194]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [moveCarInterval, setMoveCarInterval] = useState(null);

  const [sourceLat, setSourceLat] = useState(37.7749);
  const [sourceLng, setSourceLng] = useState(-122.4194);
  const [destLat, setDestLat] = useState(34.0522);
  const [destLng, setDestLng] = useState(-118.2437);

  const [timestamps, setTimestamps] = useState([]); 
  const [selectedDate, setSelectedDate] = useState('');
  const [isFetching, setIsFetching] = useState(false);


  const openRouteServiceUrl = "https://api.openrouteservice.org/v2/directions/driving-car";
  const apiKey = "5b3ce3597851110001cf624832a273e95ab3425abe02b27660be65d0"; 

  const calculateRoute = async () => {
    try {
      const response = await axios.get(`${openRouteServiceUrl}?api_key=${apiKey}&start=${sourceLng},${sourceLat}&end=${destLng},${destLat}`);
      
      console.log(response);
      const geometry = response.data.features[0].geometry.coordinates;
      console.log(geometry);
      const convertedCoordinates = geometry.map(([lng, lat]) => [lat, lng]);

      setRouteCoordinates(convertedCoordinates);
      setRoute(convertedCoordinates);
      setStepIndex(0);
      setCarPosition(convertedCoordinates[0]); 
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const startCarMovement = () => {


    const startCarMovement1 = async () => {
      try {
        const response = await axios.post('http://localhost:5000/save-coordinates', {
          coordinates: route,
          timestamp: new Date(),
        });

        console.log(response.data);
      } catch (error) {
        console.error("Error saving coordinates:", error);
      }
    };
    startCarMovement1();
    if (moveCarInterval) return; 

    const interval = setInterval(() => {
      setStepIndex((prevIndex) => {
        if (prevIndex < routeCoordinates.length - 1) {
          setCarPosition(routeCoordinates[prevIndex]);
          return prevIndex + 1;
        } else {
          clearInterval(interval);
          setMoveCarInterval(null);
          return prevIndex;
        }
      });
    }, 1000);

    setMoveCarInterval(interval);
  };

  const stopCarMovement = () => {
    if (moveCarInterval) {
      clearInterval(moveCarInterval);
      setMoveCarInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCarMovement();
    };
  }, [moveCarInterval]);


  const handleDateChange = (event) => {
    const selectedDate = event.target.value;
    setSelectedDate(selectedDate);
    fetchCoordinatesByDate(selectedDate);
  };


  const getLast7Days = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);

      const formattedDate = pastDate.toISOString().split('T')[0];
      dates.push(formattedDate);
    }

    return dates;
  };

  const last7Days = getLast7Days();
  
  return (
    <div>

      <h3>Car Movement from Source to Destination</h3>
        <div>
      <label>Select Timestamp: </label>
      <select value={selectedDate} onChange={handleDateChange}>
          <option value="">Select a Date</option>
          {last7Days.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
        <button disabled={isFetching}>
          {isFetching ? "Fetching..." : "Fetch Coordinates"}
        </button>
    </div>
      <div>
        <label>Source Latitude: </label>
        <input type="number" value={sourceLat} onChange={(e) => setSourceLat(e.target.value)} />
        <label>Source Longitude: </label>
        <input type="number" value={sourceLng} onChange={(e) => setSourceLng(e.target.value)} /><br />
        <label>Destination Latitude: </label>
        <input type="number" value={destLat} onChange={(e) => setDestLat(e.target.value)} />
        <label>Destination Longitude: </label>
        <input type="number" value={destLng} onChange={(e) => setDestLng(e.target.value)} /><br /><br />
        <button onClick={calculateRoute}>Find Route</button>
        <button onClick={startCarMovement} disabled={!routeCoordinates.length}>
          Start Movement
        </button>
        <button onClick={stopCarMovement} disabled={!moveCarInterval}>
          Stop Movement
        </button>
      </div>
      <MapContainer center={carPosition} zoom={6} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {route.length > 0 && <Polyline positions={route} color="blue" />}
        <Marker position={carPosition} icon={carIcon} />
      </MapContainer>
    </div>
  );
};

export default App;
