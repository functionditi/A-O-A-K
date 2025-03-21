import random
import math
from pyaxidraw import axidraw

# Conversion: pixels per inch (adjust as needed).
PIXELS_PER_INCH = 100.0
def to_inches(p):
    return p / PIXELS_PER_INCH

# --- Global DFS Variables (same as before) ---
pullis = []         # List of Dot objects (grid points)
framework = []      # Each edge: { 'x': currentIndex, 'y': nextIndex, 'reverse': optional flag }
grid_size = 6       # Number of grid points per row/column
spacing = 50        # Spacing between dots (pixels)
capArcs = []        # List of cap arc decorations

dfsStack = []       # Holds indices into pullis
visited = set()     # Holds visited dot indices
lastVector = None   # Last movement vector, as { 'dx': , 'dy': }

# Record of most–recent update (edge or arc)
recent_update = None

# --- Dot Class ---
class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# --- DFS Setup ---
def resetPattern():
    global pullis, framework, dfsStack, visited, lastVector, capArcs, recent_update
    pullis = []
    framework.clear()
    dfsStack.clear()
    visited.clear()
    capArcs.clear()
    lastVector = None
    recent_update = None
    for i in range(grid_size):
        for j in range(grid_size):
            pullis.append(Dot(i * spacing + spacing, j * spacing + spacing))
    visited.add(0)
    dfsStack.append(0)

# --- Utility Functions ---
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

# --- DFS Branch Functions (same as before) ---
def extendSameDirection():
    global lastVector
    if not dfsStack:
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
    if not dfsStack:
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
    if not dfsStack:
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

# --- Interactive AxiDraw Decoration Functions ---
# These functions attempt to mimic the p5.js decoration (diagonal lines and arcs)
def interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing_val, reverse, ad):
    # Replicate drawLineByAngle from p5.js:
    if angleDegrees == 90 or angleDegrees == -90:
        angle = (3 * math.pi/4 if reverse else math.pi/4)
    else:
        angle = (math.pi/4 if reverse else 3 * math.pi/4)
    # Compute endpoints as in p5.js drawDiagonalLine:
    lineLength = spacing_val * 0.33
    x1 = tempX - math.cos(angle) * lineLength
    y1 = tempY - math.sin(angle) * lineLength
    x2 = tempX + math.cos(angle) * lineLength
    y2 = tempY + math.sin(angle) * lineLength
    ad.moveto(to_inches(x1), to_inches(y1))
    ad.lineto(to_inches(x2), to_inches(y2))

def interactive_loop_around(dot, theAngle, start, stop, ad, segments=30):
    # Replicate loopAround from p5.js:
    r = (spacing * 0.66) / 2
    pts = []
    for i in range(segments + 1):
        theta = start + (stop - start) * i / segments
        # In local coordinates:
        lx = r * math.cos(theta)
        ly = r * math.sin(theta)
        # Rotate by theAngle:
        rx = math.cos(theAngle) * lx - math.sin(theAngle) * ly
        ry = math.sin(theAngle) * lx + math.cos(theAngle) * ly
        # Translate to absolute:
        abs_x = dot.x + rx
        abs_y = dot.y + ry
        pts.append((abs_x, abs_y))
    ad.moveto(to_inches(pts[0][0]), to_inches(pts[0][1]))
    for (x, y) in pts[1:]:
        ad.lineto(to_inches(x), to_inches(y))

# --- Send Recent Update to AxiDraw ---
def send_recent_update_to_axidraw(ad):
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
                    # Use same decoration as applyLoopAndStroke:
                    if aDiff == 0:
                        interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*3/4, ad)
                    elif aDiff == -90 or aDiff == 270:
                        interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*5/4, ad)
                    elif aDiff == 90 or aDiff == -270:
                        interactive_loop_around(dot1, r_angle + math.pi/2, math.pi/4, math.pi*5/4, ad)
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
    # No explicit homing command is sent; the pen remains at its last position.

# --- Interactive Loop ---
def interactive_loop():
    resetPattern()
    ad = axidraw.AxiDraw()
    ad.interactive()
    if not ad.connect():
        print("AxiDraw not connected.")
        return
    ad.options.home_after = False  # Do not home between updates.
    print("Interactive DFS AxiDraw generator (refined arc parameters)")
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
            send_recent_update_to_axidraw(ad)
            continue
        elif cmd == "q":
            print("Exiting.")
            break
        else:
            print("Unknown command.")
            continue
        send_recent_update_to_axidraw(ad)
    ad.disconnect()

def main():
    interactive_loop()

if __name__ == "__main__":
    main()

