import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet-control-geocoder";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

type SearchControlProps = {
    marker: boolean
}

const SearchControl: React.FC<SearchControlProps> = ({ marker }) => {
  const map = useMap();

  useEffect(() => {
    const geocoder = (L.Control as any)
      .geocoder({
        defaultMarkGeocode: marker ? true : false,
      })
      .on("markgeocode", function (e: any) {
        const { center } = e.geocode;
        map.setView(center, 16);
      })
      .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);

  return null;
};

export default SearchControl;