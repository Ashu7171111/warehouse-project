from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
from datetime import datetime
import urllib.request
import json

app = FastAPI(
    title="Warehouse Route Optimizer API",
    description="TSP-based delivery route optimization using OR-Tools + Real Road Distance",
    version="2.0.0"
)

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ──────────────────────────────────────────────────────────────────

class Location(BaseModel):
    name: str
    lat: float
    lng: float


class Warehouse(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = "Warehouse"


class RouteRequest(BaseModel):
    warehouse: Warehouse
    locations: List[Location]
    speed: float = 40.0        # km/h
    fuel_cost: float = 8.0     # per km


class RouteStop(BaseModel):
    name: str
    lat: float
    lng: float
    order: int


class RouteResponse(BaseModel):
    route: List[str]
    route_stops: List[RouteStop]
    distance: float
    time: str
    fuel_cost: float
    stops_count: int
    timestamp: str

# ─── Helpers ─────────────────────────────────────────────────────────────────

def haversine(lat1: float, lng1: float,
              lat2: float, lng2: float) -> float:
    """
    Fallback straight-line distance in KM
    """

    R = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(dlambda / 2) ** 2
    )

    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def road_distance(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float
) -> float:
    """
    Get actual road distance using OSRM API
    """

    try:
        url = (
            f"http://router.project-osrm.org/"
            f"route/v1/driving/"
            f"{lng1},{lat1};{lng2},{lat2}"
            f"?overview=false"
        )

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "RouteFlow/1.0"
            }
        )

        with urllib.request.urlopen(req, timeout=3) as response:

            data = json.loads(response.read())

            if data["code"] == "Ok":
                # meters → km
                return data["routes"][0]["distance"] / 1000

    except Exception:
        pass

    # fallback if API fails
    return haversine(lat1, lng1, lat2, lng2)


async def build_distance_matrix(
    warehouse: Warehouse,
    locations: List[Location]
) -> List[List[float]]:
    """
    Build distance matrix using real road distance
    """

    nodes = (
        [(warehouse.lat, warehouse.lng)]
        + [(loc.lat, loc.lng) for loc in locations]
    )

    n = len(nodes)

    matrix = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):

            if i != j:

                matrix[i][j] = await road_distance(
                    nodes[i][0],
                    nodes[i][1],
                    nodes[j][0],
                    nodes[j][1]
                )

    return matrix


def route_distance(
    route: List[int],
    distance_matrix: List[List[float]]
) -> float:

    return sum(
        distance_matrix[route[i]][route[i + 1]]
        for i in range(len(route) - 1)
    )


def solve_tsp_nearest_neighbor(
    distance_matrix: List[List[float]]
) -> List[int]:
    """
    Nearest Neighbor heuristic
    """

    n = len(distance_matrix)

    visited = [False] * n

    route = [0]

    visited[0] = True

    for _ in range(n - 1):

        current = route[-1]

        nearest = -1

        nearest_dist = float("inf")

        for j in range(n):

            if (
                not visited[j]
                and distance_matrix[current][j] < nearest_dist
            ):

                nearest_dist = distance_matrix[current][j]

                nearest = j

        route.append(nearest)

        visited[nearest] = True

    # return to warehouse
    route.append(0)

    return route


def two_opt_improve(
    route: List[int],
    distance_matrix: List[List[float]]
) -> List[int]:
    """
    2-opt local optimization
    """

    best = route[:]

    improved = True

    while improved:

        improved = False

        for i in range(1, len(best) - 2):

            for j in range(i + 1, len(best) - 1):

                new_route = (
                    best[:i]
                    + best[i:j + 1][::-1]
                    + best[j + 1:]
                )

                if (
                    route_distance(new_route, distance_matrix)
                    < route_distance(best, distance_matrix)
                ):

                    best = new_route

                    improved = True

    return best


def solve_tsp_ortools(
    distance_matrix: List[List[float]]
) -> List[int]:
    """
    Solve TSP using OR-Tools
    fallback → nearest neighbor + 2-opt
    """

    try:

        from ortools.constraint_solver import pywrapcp
        from ortools.constraint_solver import routing_enums_pb2

        n = len(distance_matrix)

        manager = pywrapcp.RoutingIndexManager(n, 1, 0)

        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):

            from_node = manager.IndexToNode(from_index)

            to_node = manager.IndexToNode(to_index)

            return int(
                distance_matrix[from_node][to_node] * 1000
            )

        transit_callback_index = (
            routing.RegisterTransitCallback(
                distance_callback
            )
        )

        routing.SetArcCostEvaluatorOfAllVehicles(
            transit_callback_index
        )

        search_params = (
            pywrapcp.DefaultRoutingSearchParameters()
        )

        search_params.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy
            .PATH_CHEAPEST_ARC
        )

        search_params.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic
            .GUIDED_LOCAL_SEARCH
        )

        search_params.time_limit.seconds = 5

        solution = routing.SolveWithParameters(
            search_params
        )

        if solution:

            route = []

            index = routing.Start(0)

            while not routing.IsEnd(index):

                route.append(
                    manager.IndexToNode(index)
                )

                index = solution.Value(
                    routing.NextVar(index)
                )

            route.append(0)

            return route

    except ImportError:
        pass

    # fallback algorithm

    nn_route = solve_tsp_nearest_neighbor(
        distance_matrix
    )

    return two_opt_improve(
        nn_route,
        distance_matrix
    )

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def health():

    return {
        "status": "ok",
        "service": "Warehouse Route Optimizer"
    }


@app.post(
    "/optimize-route",
    response_model=RouteResponse
)
async def optimize_route(req: RouteRequest):

    if not req.locations:

        raise HTTPException(
            status_code=400,
            detail="At least one delivery location required."
        )

    if len(req.locations) > 25:

        raise HTTPException(
            status_code=400,
            detail="Maximum 25 delivery locations supported."
        )

    # Build Distance Matrix

    matrix = await build_distance_matrix(
        req.warehouse,
        req.locations
    )

    # Solve TSP

    route_indices = solve_tsp_ortools(matrix)

    # Build Response

    all_nodes = (
        [req.warehouse]
        + list(req.locations)
    )

    names = (
        [req.warehouse.name]
        + [loc.name for loc in req.locations]
    )

    route_names = [
        names[i]
        for i in route_indices
    ]

    total_dist = round(
        route_distance(route_indices, matrix),
        2
    )

    total_time_h = (
        total_dist / req.speed
        if req.speed > 0 else 0
    )

    total_minutes = int(total_time_h * 60)

    total_fuel = round(
        total_dist * req.fuel_cost,
        2
    )

    if total_minutes >= 60:

        time_str = (
            f"{total_minutes // 60}h "
            f"{total_minutes % 60}min"
        )

    else:

        time_str = f"{total_minutes} min"

    # Route Stops

    stops = []

    for order, idx in enumerate(route_indices):

        node = all_nodes[idx]

        stops.append(

            RouteStop(
                name=names[idx],
                lat=node.lat,
                lng=node.lng,
                order=order
            )
        )

    return RouteResponse(
        route=route_names,
        route_stops=stops,
        distance=total_dist,
        time=time_str,
        fuel_cost=total_fuel,
        stops_count=len(req.locations),
        timestamp=datetime.utcnow().isoformat()
    )