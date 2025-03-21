import random
import math
import svgwrite
from pyaxidraw import axidraw

# --- Global Variables ---
pullis = []         # List of Dot objects (grid points)
framework = []      # List of edges: { 'x': currentIndex, 'y': nextIndex, 'reverse': optional flag }
grid_size = 6       # (original "size")
spacing = 50        # Distance between dots
cpd = None          # (preserved for reference)
capArcs = []        # List of cap arc decorations

# DFS state variables:
dfsStack = []       # Holds indices into pullis
visited = set()     # Holds visited dot indices

# Last movement vector (dictionary with 'dx' and 'dy')
lastVector = None

# Global SVG drawing (will be recreated on each update)
current_svg = None

# Record the most–recent update.
# It is a dict with key 'type' equal to 'edge' or 'arc'
recent_update = None

# Global flag to draw the grid only on the very first save (for display only)
grid_drawn = False

# --- Dot Class ---
class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# --- Grid and DFS Setup ---
def resetPattern():
    global pullis, framework, dfsStack, visited, lastVector, capArcs, recent_update, grid_drawn
    pullis = []
    framework.clear()
    dfsStack.clear()
    visited.clear()
    capArcs.clear()
    lastVector = None
    recent_update = None
    grid_drawn = False

    # Create grid of dots.
    for i in range(grid_size):
        for j in range(grid_size):
            pullis.append(Dot(i * spacing + spacing, j * spacing + spacing))
    
    # Start DFS from the first dot (index 0).
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

# --- DFS Branch Functions ---
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
    
    # Draw a cap arc around the current dot.
    r_angle = 0
    if lastVector:
        r_angle = math.atan2(lastVector['dy'], lastVector['dx']) + math.pi
    cap_info = {'dot': currentDot, 'angle': r_angle, 'start': math.pi/4, 'stop': math.pi*7/4}
    capArcs.append(cap_info)
    recent_update = {'type': 'arc', 'arc': cap_info}

    # Add reverse edges.
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

# --- Decoration Helper Functions ---
def applyLoopAndStroke(aDiff, r_angle, dot1):
    if aDiff == 0:
        loopAround(dot1, r_angle, math.pi/4, math.pi*3/4)
    elif aDiff == -90 or aDiff == 270:
        loopAround(dot1, r_angle, math.pi/4, math.pi*5/4)
    elif aDiff == 90 or aDiff == -270:
        loopAround(dot1, r_angle + math.pi/2, math.pi/4, math.pi*5/4)

def drawLineByAngle(angleDegrees, tempX, tempY, spacing_val, reverse=False):
    angle = (3 * math.pi/4 if reverse else math.pi/4) if (angleDegrees == 90 or angleDegrees == -90) else (math.pi/4 if reverse else 3 * math.pi/4)
    drawDiagonalLine(tempX, tempY, spacing_val * 0.33, angle)

def drawDiagonalLine(midX, midY, lineLength, angle):
    x1 = midX - math.cos(angle) * lineLength
    y1 = midY - math.sin(angle) * lineLength
    x2 = midX + math.cos(angle) * lineLength
    y2 = midY + math.sin(angle) * lineLength
    # Only add the decoration (blue line).
    current_svg.add(current_svg.line(start=(x1, y1), end=(x2, y2), stroke='blue'))

def loopAround(dot, theAngle, start, stop):
    r = (spacing * 0.66) / 2
    start_x = r * math.cos(start)
    start_y = r * math.sin(start)
    end_x = r * math.cos(stop)
    end_y = r * math.sin(stop)
    large_arc = 1 if (stop - start) > math.pi else 0
    path_data = ("M {sx},{sy} A {r},{r} 0 {la},1 {ex},{ey}"
                 .format(sx=start_x, sy=start_y, r=r, la=large_arc, ex=end_x, ey=end_y))
    grp = current_svg.g(transform="translate({x},{y}) rotate({angle})".format(
        x=dot.x, y=dot.y, angle=math.degrees(theAngle)))
    grp.add(current_svg.path(d=path_data, fill="none", stroke="blue"))
    current_svg.add(grp)

# --- Generate SVG for Recent Update ---
def generate_recent_svg():
    global current_svg, grid_drawn
    width = (grid_size + 1) * spacing
    height = (grid_size + 1) * spacing
    current_svg = svgwrite.Drawing(size=(width, height))
    # For the very first save, draw the grid; subsequent updates get a plain white background.
    if not grid_drawn:
        # Draw grid (black dots)
        for dot in pullis:
            current_svg.add(current_svg.circle(center=(dot.x, dot.y), r=2.5, fill='black'))
        grid_drawn = True
    else:
        # Plain white background (without a rectangle that might cause a stray line)
        current_svg.add(current_svg.rect(insert=(0, 0), size=(width, height), fill='white'))
    
    # Draw only the most recent update with full decoration.
    if recent_update and recent_update['type'] == 'edge':
        i = len(framework) - 1  # index of the new edge
        edge = framework[i]
        dot1 = pullis[edge['x']]
        dot2 = pullis[edge['y']]
        tempX = (dot1.x + dot2.x) / 2
        tempY = (dot1.y + dot2.y) / 2
        r_angle = math.atan2(dot2.y - dot1.y, dot2.x - dot1.x)
        angleDegrees = math.degrees(r_angle)
        if i == 0:
            drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse=True)
            loopAround(dot1, r_angle, math.pi/4, math.pi*7/4)
        else:
            prev_edge = framework[i-1]
            prev_dot1 = pullis[prev_edge['x']]
            prev_dot2 = pullis[prev_edge['y']]
            prev_r_angle = math.atan2(prev_dot2.y - prev_dot1.y, prev_dot2.x - prev_dot1.x)
            prevA = math.degrees(prev_r_angle)
            aDiff = angleDegrees - prevA
            if i % 2 == 1:
                if aDiff == 90 or aDiff == -270:
                    drawLineByAngle(angleDegrees, tempX, tempY, spacing)
                else:
                    applyLoopAndStroke(aDiff, r_angle, dot1)
                    drawLineByAngle(angleDegrees, tempX, tempY, spacing)
            else:
                if aDiff == 90 or aDiff == -270:
                    applyLoopAndStroke(aDiff, r_angle, dot1)
                    drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse=True)
                elif aDiff == -90 or aDiff == 270:
                    drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse=True)
                elif aDiff == 0:
                    applyLoopAndStroke(aDiff, r_angle + math.pi, dot1)
                    drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse=True)
    elif recent_update and recent_update['type'] == 'arc':
        arc = recent_update['arc']
        loopAround(arc['dot'], arc['angle'], arc['start'], arc['stop'])
    
    # Highlight current DFS tip.
    if dfsStack:
        currentDot = pullis[dfsStack[-1]]
        current_svg.add(current_svg.circle(center=(currentDot.x, currentDot.y), r=5, fill='rgb(0,255,0)'))
    
    current_svg.saveas("output.svg")
    print("SVG (recent update only, full decoration) saved as output.svg")

# --- AxiDraw Plotting Function ---
def plot_svg_on_axidraw():
    FILE_NAME = "output.svg"
    try:
        ad = axidraw.AxiDraw()
        ad.plot_setup(FILE_NAME)
        # Set additional plotting options here if desired.
        ad.plot_run()
        print("Plot sent to AxiDraw.")
    except Exception as e:
        print("Error plotting on AxiDraw:", e)

# --- Interactive Loop ---
def interactive_loop():
    resetPattern()
    generate_recent_svg()  # Save initial SVG (with grid)
    print("Interactive DFS SVG generator with AxiDraw plotting")
    print("Commands:")
    print("  1: Extend in same direction")
    print("  2: Extend with a turn")
    print("  0: Terminate branch")
    print("  s: Save current drawing")
    print("  p: Plot current SVG on AxiDraw")
    print("  q: Quit")
    while True:
        cmd = input("Enter command (1/2/0/s/p/q): ").strip()
        if cmd == "1":
            extendSameDirection()
        elif cmd == "2":
            extendTurn()
        elif cmd == "0":
            terminateBranch()
        elif cmd == "s":
            pass  # just save below.
        elif cmd == "p":
            generate_recent_svg()  # Update SVG first
            plot_svg_on_axidraw()
            continue
        elif cmd == "q":
            print("Exiting.")
            break
        else:
            print("Unknown command.")
            continue

        generate_recent_svg()  # Save the updated SVG

# --- Main ---
def main():
    interactive_loop()

if __name__ == "__main__":
    main()

