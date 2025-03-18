// src/components/MapWithAStar.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper function to calculate the heuristic (Euclidean distance)
const heuristic = (a, b) => {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
};
const getNeighbors = (node, walkablePoints) => {
    const { lat, lng } = node;
    const possibleSteps = [
      { lat: lat + 0.005, lng },     // Up
      { lat: lat - 0.005, lng },     // Down
      { lat, lng: lng + 0.005 },     // Right
      { lat, lng: lng - 0.005 }      // Left
    ];
  
    return possibleSteps.filter(neighbor => 
      walkablePoints.some(point => point.lat === neighbor.lat && point.lng === neighbor.lng)
    );
  };
  

// A* Algorithm Implementation
const astar = (start, end, walkablePoints) => {
    console.log("A* Algorithm Start:", start, "End:", end, "Walkable Points:", walkablePoints.length);
  
    const openSet = new Set([`${start.lat}-${start.lng}`]);
    const cameFrom = {};
    const gScore = { [`${start.lat}-${start.lng}`]: 0 };
    const fScore = { [`${start.lat}-${start.lng}`]: heuristic(start, end) };
  
    while (openSet.size > 0) {
      let current;
      let lowestFScore = Infinity;
  
      openSet.forEach(node => {
        if (fScore[node] < lowestFScore) {
          lowestFScore = fScore[node];
          current = node;
        }
      });
  
      const [currentLat, currentLng] = current.split('-').map(Number);
      if (currentLat === end.lat && currentLng === end.lng) {
        let path = [];
        let curr = current;
        while (curr) {
          const [lat, lng] = curr.split('-').map(Number);
          path.push({ lat, lng });
          curr = cameFrom[curr];
        }
        console.log("Path found:", path);
        return path.reverse();
      }
  
      openSet.delete(current);
      const currentNodeNeighbors = getNeighbors({ lat: currentLat, lng: currentLng }, walkablePoints);
  
      currentNodeNeighbors.forEach(neighbor => {
        const neighborKey = `${neighbor.lat}-${neighbor.lng}`;
        const tentativeGScore = gScore[current] + 1; // Assume each step has equal cost
  
        if (tentativeGScore < (gScore[neighborKey] || Infinity)) {
          cameFrom[neighborKey] = current;
          gScore[neighborKey] = tentativeGScore;
          fScore[neighborKey] = tentativeGScore + heuristic(neighbor, end);
  
          if (!openSet.has(neighborKey)) {
            openSet.add(neighborKey);
          }
        }
      });
    }
  
    console.log("No path found");
    return [];
  };
  

const MapWithAStar = () => {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [walkablePoints, setWalkablePoints] = useState([]);

  // Custom Hook to handle map clicks
  function LocationMarker() {
    useMapEvents({
      click(event) {
        const { lat, lng } = event.latlng;
        console.log("Map clicked at: ", lat, lng);

        if (!start) {
          setStart({ lat, lng });
          console.log("Start point set to: ", { lat, lng });
        } else if (!end) {
          setEnd({ lat, lng });
          console.log("End point set to: ", { lat, lng });
        }
      },
    });

    return null;
  }

  useEffect(() => {
    if (start && end) {
      const computedPath = astar(start, end, walkablePoints);
      setPath(computedPath);
      console.log("Computed Path: ", computedPath);
    }
  }, [start, end, walkablePoints]);

  const fetchWalkablePoints = () => {
    const points = [];
    for (let i = 51.45; i < 51.55; i += 0.005) {
      for (let j = -0.1; j < -0.05; j += 0.005) {
        points.push({ lat: i, lng: j });
      }

    }
    console.log(points);
    setWalkablePoints(points);
  };

  useEffect(() => {
    fetchWalkablePoints();
  }, []);

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: '60vh', width: '50%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker />
      {start && (
        <Marker position={[start.lat, start.lng]}>
          <Popup>Start Point</Popup>
        </Marker>
      )}
      {end && (
        <Marker position={[end.lat, end.lng]} >
          <Popup>End Point</Popup>
        </Marker>
      )}
      {path.length > 0 && <Polyline positions={path.map(([lat, lng]) => [lat, lng])} color="red" />}
    </MapContainer>
  );
};

export default MapWithAStar;
