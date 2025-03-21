import random
import math
from pyaxidraw import axidraw

# Conversion: how many pixels per inch in our drawing.
PIXELS_PER_INCH = 100.0
def to_inches(p): 
    return p / PIXELS_PER_INCH

# --- Global Variables (same DFS state as before) ---
pullis = []         # List of Dot objects (grid points)
framework = []      # List of edges: { 'x': currentIndex, 'y': nextIndex, 'reverse': optional flag }
grid_size = 6       # Number of grid points per row/column (as in original "size")
spacing = 50        # Spacing between dots (in pixels)
capArcs = []        # List of cap arc decorations

# DFS state variables:
dfsStack = []       # Holds indices into pullis
visited = set()     # Holds visited dot indices

lastVector = None   # Last movement vector (dictionary with keys 'dx' and 'dy')

# Record the most–recent update.
# It is a dictionary with key 'type' equal to 'edge' or 'arc'
recent_update = None

# --- Dot Class ---
class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# --- DFS Setup (same as before) ---
def resetPattern():
    global pullis, framework, dfsStack, visited, lastVector, capArcs, recent_update
    pullis = []
    framework.clear()
    dfsStack.clear()
    visited.clear()
    capArcs.clear()
    lastVector = None
    recent_update = None

    # Create grid of dots.
    for i in range(grid_size):
        for j in range(grid_size):
            # We position dots with an offset equal to spacing.
            pullis.append(Dot(i * spacing + spacing, j * spacing + spacing))
    
    # Start DFS from the first dot.
    visited.add(0)
    dfsStack.append(0)

# --- DFS Branch Functions (unchanged from before) ---
def extendSameDirection():
    global lastVector
    if len(dfsStack) == 0:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    if not lastVector:
        return extendRandom(currentIndex)
    
    candidateX = currentDot.x + lastVector['dx'] * spacing
    candidateY = currentDot.y + lastVector['dy'] * spacing
    candidateIndex = findDotByCoord(candidateX, candidateY)
    if candidateIndex != -1 and candidateIndex not in visited:
        addEdge(currentIndex, candidateIndex, {'dx': lastVector['dx'], 'dy': lastVector['dy']})
    else:
        extendRandom(currentIndex)

def extendTurn():
    global lastVector
    if len(dfsStack) == 0:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    if not lastVector:
        return extendRandom(currentIndex)
    
    turnLeft = random.random() < 0.5
    if turnLeft:
        newVector = {'dx': -lastVector['dy'], 'dy': lastVector['dx']}
    else:
        newVector = {'dx': lastVector['dy'], 'dy': -lastVector['dx']}
    
    candidateX = currentDot.x + newVector['dx'] * spacing
    candidateY = currentDot.y + newVector['dy'] * spacing
    candidateIndex = findDotByCoord(candidateX, candidateY)
    if candidateIndex != -1 and candidateIndex not in visited:
        addEdge(currentIndex, candidateIndex, newVector)
    else:
        if turnLeft:
            newVector = {'dx': lastVector['dy'], 'dy': -lastVector['dx']}
        else:
            newVector = {'dx': -lastVector['dy'], 'dy': lastVector['dx']}
        candidateX = currentDot.x + newVector['dx'] * spacing
        candidateY = currentDot.y + newVector['dy'] * spacing
        candidateIndex = findDotByCoord(candidateX, candidateY)
        if candidateIndex != -1 and candidateIndex not in visited:
            addEdge(currentIndex, candidateIndex, newVector)
        else:
            extendRandom(currentIndex)

def extendRandom(currentIndex):
    currentDot = pullis[currentIndex]
    neighbors = getAdjacentUnvisited(currentDot)
    if neighbors:
        nextIndex = random.choice(neighbors)
        nextDot = pullis[nextIndex]
        dx = (nextDot.x - currentDot.x) / spacing
        dy = (nextDot.y - currentDot.y) / spacing
        addEdge(currentIndex, nextIndex, {'dx': dx, 'dy': dy})
    else:
        terminateBranch()

def terminateBranch():
    global dfsStack, lastVector, recent_update
    if len(dfsStack) == 0:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    r_angle = 0
    if lastVector:
        r_angle = math.atan2(lastVector['dy'], lastVector['dx']) + math.pi
    cap_info = {'dot': currentDot, 'angle': r_angle, 'start': math.pi/4, 'stop': math.pi*7/4}
    capArcs.append(cap_info)
    recent_update = {'type': 'arc', 'arc': cap_info}
    while len(dfsStack) > 1:
        childIndex = dfsStack.pop()
        parentIndex = dfsStack[-1]
        childDot = pullis[childIndex]
        parentDot = pullis[parentIndex]
        reverseVector = {'dx': (parentDot.x - childDot.x) / spacing,
                         'dy': (parentDot.y - childDot.y) / spacing}
        addReverseEdge(childIndex, parentIndex, reverseVector)
    dfsStack.clear()
    lastVector = None
    unvisitedIndices = [i for i in range(len(pullis)) if i not in visited]
    if unvisitedIndices:
        newSource = random.choice(unvisitedIndices)
        visited.add(newSource)
        dfsStack.append(newSource)
    else:
        print("All dots visited.")

def addEdge(currentIndex, nextIndex, vector):
    global lastVector, recent_update
    framework.append({'x': currentIndex, 'y': nextIndex})
    visited.add(nextIndex)
    dfsStack.append(nextIndex)
    lastVector = vector
    recent_update = {'type': 'edge', 'edge': {'currentIndex': currentIndex, 'nextIndex': nextIndex, 'vector': vector}}

def addReverseEdge(currentIndex, parentIndex, vector):
    global lastVector, recent_update
    framework.append({'x': currentIndex, 'y': parentIndex, 'reverse': True})
    lastVector = vector
    recent_update = {'type': 'edge', 'edge': {'currentIndex': currentIndex, 'nextIndex': parentIndex, 'vector': vector}}

# --- Utility Helpers ---
def findDotByCoord(x, y):
    for i, dot in enumerate(pullis):
        if dot.x == x and dot.y == y:
            return i
    return -1

def isAdjacent(dot1, dot2):
    return ((abs(dot1.x - dot2.x) == spacing and dot1.y == dot2.y) or
            (dot1.x == dot2.x and abs(dot1.y - dot2.y) == spacing))

def getAdjacentUnvisited(dot):
    indices = []
    for i, other in enumerate(pullis):
        if i not in visited and isAdjacent(dot, other):
            indices.append(i)
    return indices

# --- Interactive AxiDraw Decoration Functions ---
# Instead of drawing to an SVG, we issue interactive commands.

# Draw a blue line from (midX, midY) offset by a given angle and length.
def interactive_draw_line(midX, midY, lineLength, angle, ad):
    x1 = midX - math.cos(angle) * lineLength
    y1 = midY - math.sin(angle) * lineLength
    x2 = midX + math.cos(angle) * lineLength
    y2 = midY + math.sin(angle) * lineLength
    # Convert coordinates from pixels to inches.
    ad.moveto(to_inches(x1), to_inches(y1))
    ad.lineto(to_inches(x2), to_inches(y2))

# Approximate an arc (blue loop) using N small line segments.
def interactive_draw_arc(cx, cy, radius, start_angle, stop_angle, ad, segments=20):
    # Generate points along the arc.
    points = []
    for i in range(segments + 1):
        theta = start_angle + (stop_angle - start_angle) * i / segments
        x = cx + radius * math.cos(theta)
        y = cy + radius * math.sin(theta)
        points.append((x, y))
    # Move to the first point (pen up), then draw lines.
    ad.moveto(to_inches(points[0][0]), to_inches(points[0][1]))
    for (x, y) in points[1:]:
        ad.lineto(to_inches(x), to_inches(y))

# Mimic our decoration functions in interactive mode.
def interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing_val, reverse, ad):
    # Determine angle based on our original logic.
    if angleDegrees == 90 or angleDegrees == -90:
        angle = (3 * math.pi/4 if reverse else math.pi/4)
    else:
        angle = (math.pi/4 if reverse else 3 * math.pi/4)
    interactive_draw_line(tempX, tempY, spacing_val * 0.33, angle, ad)

def interactive_loop_around(dot, theAngle, start, stop, ad):
    # Our loopAround: center at dot.x, dot.y.
    r = (spacing * 0.66) / 2
    # We'll draw the arc with center at (dot.x, dot.y) with radius r.
    interactive_draw_arc(dot.x, dot.y, r, start, stop, ad, segments=20)

# --- Generate and Send Recent Update to AxiDraw ---
def send_recent_update_to_axidraw(ad):
    # ad is the active AxiDraw instance.
    if recent_update is None:
        print("No recent update to send.")
        return
    if recent_update['type'] == 'edge':
        i = len(framework) - 1  # index of the new edge
        edge = framework[i]
        dot1 = pullis[edge['x']]
        dot2 = pullis[edge['y']]
        tempX = (dot1.x + dot2.x) / 2
        tempY = (dot1.y + dot2.y) / 2
        r_angle = math.atan2(dot2.y - dot1.y, dot2.x - dot1.x)
        angleDegrees = math.degrees(r_angle)
        if i == 0:
            interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
            interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*7/4, ad)
        else:
            prev_edge = framework[i-1]
            prev_dot1 = pullis[prev_edge['x']]
            prev_dot2 = pullis[prev_edge['y']]
            prev_r_angle = math.atan2(prev_dot2.y - prev_dot1.y, prev_dot2.x - prev_dot1.x)
            prevA = math.degrees(prev_r_angle)
            aDiff = angleDegrees - prevA
            if i % 2 == 1:
                if aDiff == 90 or aDiff == -270:
                    interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=False, ad=ad)
                else:
                    # Apply loop decoration then draw diagonal.
                    # We mimic applyLoopAndStroke by drawing a loop.
                    interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*3/4, ad)
                    interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=False, ad=ad)
            else:
                if aDiff == 90 or aDiff == -270:
                    interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*5/4, ad)
                    interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
                elif aDiff == -90 or aDiff == 270:
                    interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
                elif aDiff == 0:
                    interactive_loop_around(dot1, r_angle + math.pi, math.pi/4, math.pi*3/4, ad)
                    interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
    elif recent_update['type'] == 'arc':
        arc = recent_update['arc']
        interactive_loop_around(arc['dot'], arc['angle'], arc['start'], arc['stop'], ad)
    # Note: No explicit “home” move is sent so that the AxiDraw remains at its last position.

# --- Interactive Loop ---
def interactive_loop():
    resetPattern()
    # Initialize AxiDraw interactive mode.
    ad = axidraw.AxiDraw()
    ad.interactive()  # Enter interactive context.
    if not ad.connect():
        print("AxiDraw not connected.")
        return
    print("Interactive DFS AxiDraw generator (interactive mode)")
    print("Commands:")
    print("  1: Extend in same direction")
    print("  2: Extend with a turn")
    print("  0: Terminate branch")
    print("  p: Send recent update to AxiDraw")
    print("  q: Quit")
    while True:
        cmd = input("Enter command (1/2/0/p/q): ").strip()
        if cmd == "1":
            extendSameDirection()
        elif cmd == "2":
            extendTurn()
        elif cmd == "0":
            terminateBranch()
        elif cmd == "p":
            # Send the recent update interactively.
            send_recent_update_to_axidraw(ad)
            continue
        elif cmd == "q":
            print("Exiting.")
            break
        else:
            print("Unknown command.")
            continue
        # After each DFS update, you can also choose to send the update.
        send_recent_update_to_axidraw(ad)
    ad.disconnect()

def main():
    interactive_loop()

if __name__ == "__main__":
    main()

