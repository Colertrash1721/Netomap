import L from "leaflet";

export const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();

  let sizeClass = "marker-cluster-small";
  let colorClass = "cluster-blue";

  if (count >= 50) {
    sizeClass = "marker-cluster-large";
    colorClass = "cluster-red";
  } else if (count >= 20) {
    sizeClass = "marker-cluster-medium";
    colorClass = "cluster-yellow";
  }

  return L.divIcon({
    html: `
      <div class="marker-cluster ${sizeClass} ${colorClass}">
        <div>
          <span>${count}</span>
        </div>
      </div>
    `,
    className: "custom-marker-cluster",
    iconSize: L.point(40, 40, true),
  });
};