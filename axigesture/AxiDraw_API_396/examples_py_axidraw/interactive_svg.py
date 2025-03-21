import random
import math
import svgwrite

# --- Global Variables ---
pullis = []        # List of Dot objects (grid points)
framework = []     # Each edge is a dict: { 'x': currentIndex, 'y': nextIndex, 'reverse': optional flag }
grid_size = 6      # Number of dots per row/column (original "size")
spacing = 50       # Distance between dots
cpd = None         # (unused here, but preserved for reference)
capArcs = []       # List to store arc decorations

# DFS state variables:
dfsStack = []      # Stack holding indices into pullis
visited = set()    # Set of visited dot indices

# For manual direction control:
lastVector = None  # Dictionary with keys 'dx' and 'dy' (in grid units)

# Global SVG drawing (will be created/updated each time)
current_svg = None

# --- Dot Class ---
class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# --- Grid and DFS Setup ---
def resetPattern():
    global pullis, framework, dfsStack, visited, lastVector, capArcs
    pullis = []
    framework.clear()
    dfsStack.clear()
    visited.clear()
    capArcs.clear()
    lastVector = None

    # Create grid of dots.
    for i in range(grid_size):
        for j in range(grid_size):
            # (i, j) grid converted to canvas coordinates.
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
    # For grid directions, a 90° rotation.
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
        # Try the opposite turn.
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
    global dfsStack, lastVector
    if len(dfsStack) == 0:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    
    # --- 1) Draw a "cap" arc around the current dot.
    r_angle = 0
    if lastVector:
        r_angle = math.atan2(lastVector['dy'], lastVector['dx']) + math.pi
    # (In the SVG version, we simply record the cap arc for later drawing.)
    capArcs.append({
        'dot': currentDot,
        'angle': r_angle,
        'start': math.pi/4,
        'stop': math.pi*7/4
    })
    
    # --- 2) Add reverse edges.
    while len(dfsStack) > 1:
        childIndex = dfsStack.pop()
        parentIndex = dfsStack[-1]
        childDot = pullis[childIndex]
        parentDot = pullis[parentIndex]
        reverseVector = {
            'dx': (parentDot.x - childDot.x) / spacing,
            'dy': (parentDot.y - childDot.y) / spacing
        }
        addReverseEdge(childIndex, parentIndex, reverseVector)
    
    dfsStack.clear()
    lastVector = None
    
    # --- 3) Start a new branch from a random unvisited dot.
    unvisitedIndices = [i for i in range(len(pullis)) if i not in visited]
    if unvisitedIndices:
        newSource = random.choice(unvisitedIndices)
        visited.add(newSource)
        dfsStack.append(newSource)
    else:
        print("All dots visited.")

def addEdge(currentIndex, nextIndex, vector):
    global lastVector
    framework.append({'x': currentIndex, 'y': nextIndex})
    visited.add(nextIndex)
    dfsStack.append(nextIndex)
    lastVector = vector

def addReverseEdge(currentIndex, parentIndex, vector):
    global lastVector
    framework.append({'x': currentIndex, 'y': parentIndex, 'reverse': True})
    lastVector = vector

# --- Decoration Helper Functions ---
def applyLoopAndStroke(aDiff, r_angle, dot1):
    # This function applies a loop decoration based on the angular difference.
    if aDiff == 0:
        loopAround(dot1, r_angle, math.pi/4, math.pi*3/4)
    elif aDiff == -90 or aDiff == 270:
        loopAround(dot1, r_angle, math.pi/4, math.pi*5/4)
    elif aDiff == 90 or aDiff == -270:
        loopAround(dot1, r_angle + math.pi/2, math.pi/4, math.pi*5/4)

def drawLineByAngle(angleDegrees, tempX, tempY, spacing_val, reverse=False):
    # Mimic the original logic for diagonal line decoration.
    angle = (3 * math.pi/4 if reverse else math.pi/4) if (angleDegrees == 90 or angleDegrees == -90) else (math.pi/4 if reverse else 3 * math.pi/4)
    drawDiagonalLine(tempX, tempY, spacing_val * 0.33, angle)

def drawDiagonalLine(midX, midY, lineLength, angle):
    x1 = midX - math.cos(angle) * lineLength
    y1 = midY - math.sin(angle) * lineLength
    x2 = midX + math.cos(angle) * lineLength
    y2 = midY + math.sin(angle) * lineLength
    current_svg.add(current_svg.line(start=(x1, y1), end=(x2, y2), stroke='blue'))

def loopAround(dot, theAngle, start, stop):
    # In the original, push/pop, translate, rotate, and then draw an arc.
    # Here we simulate that by computing an arc path and using an SVG group with a transform.
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

# --- SVG Generation ---
def generate_svg():
    global current_svg
    width = (grid_size + 1) * spacing
    height = (grid_size + 1) * spacing
    current_svg = svgwrite.Drawing(size=(width, height))
    # White background.
    current_svg.add(current_svg.rect(insert=(0, 0), size=(width, height), fill='white'))
    
    # Draw grid dots.
    for dot in pullis:
        current_svg.add(current_svg.circle(center=(dot.x, dot.y), r=2.5, fill='black'))
    
    # Draw all edges with decoration.
    angleArray = []
    for i, edge in enumerate(framework):
        dot1 = pullis[edge['x']]
        dot2 = pullis[edge['y']]
        # Draw basic line.
        current_svg.add(current_svg.line(start=(dot1.x, dot1.y),
                                         end=(dot2.x, dot2.y),
                                         stroke='rgb(220,220,220)'))
        # Compute midpoint and angle.
        tempX = (dot1.x + dot2.x) / 2
        tempY = (dot1.y + dot2.y) / 2
        r_angle = math.atan2(dot2.y - dot1.y, dot2.x - dot1.x)
        angleDegrees = math.degrees(r_angle)
        angleArray.append(angleDegrees)
        
        # Decoration for each edge.
        if i == 0:
            drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse=True)
            # Draw a blue arc around the starting dot.
            current_svg.add(current_svg.path(d=create_arc_path(dot1, r_angle, math.pi/4, math.pi*7/4),
                                             fill="none", stroke="blue"))
        else:
            prevA = angleArray[i - 1] if i - 1 >= 0 else 0
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
    
    # Draw saved cap arcs.
    for arcInfo in capArcs:
        loopAround(arcInfo['dot'], arcInfo['angle'], arcInfo['start'], arcInfo['stop'])
    
    # Highlight the current DFS tip.
    if dfsStack:
        currentDot = pullis[dfsStack[-1]]
        current_svg.add(current_svg.circle(center=(currentDot.x, currentDot.y), r=5, fill='rgb(0,255,0)'))
    
    current_svg.saveas("output.svg")
    print("SVG saved as output.svg")

def create_arc_path(dot, r_angle, start, stop):
    # Helper: creates an arc path (similar to loopAround) for one-off use.
    r = (spacing * 0.66) / 2
    start_x = r * math.cos(start)
    start_y = r * math.sin(start)
    end_x = r * math.cos(stop)
    end_y = r * math.sin(stop)
    large_arc = 1 if (stop - start) > math.pi else 0
    path_data = ("M {sx},{sy} A {r},{r} 0 {la},1 {ex},{ey}"
                 .format(sx=start_x, sy=start_y, r=r, la=large_arc, ex=end_x, ey=end_y))
    # Note: we return the path data without a transform.
    return path_data

# --- Interactive Loop ---
def interactive_loop():
    resetPattern()
    generate_svg()  # Save initial drawing.
    print("Interactive DFS SVG generator")
    print("Commands:")
    print("  1: Extend in same direction")
    print("  2: Extend with a turn")
    print("  0: Terminate branch")
    print("  s: Save current drawing")
    print("  q: Quit")
    while True:
        cmd = input("Enter command (1/2/0/s/q): ").strip()
        if cmd == "1":
            extendSameDirection()
        elif cmd == "2":
            extendTurn()
        elif cmd == "0":
            terminateBranch()
        elif cmd == "s":
            pass  # Just save below.
        elif cmd == "q":
            print("Exiting.")
            break
        else:
            print("Unknown command.")
            continue

        generate_svg()  # Update the SVG after each command

# --- Main ---
def main():
    interactive_loop()

if __name__ == "__main__":
    main()

