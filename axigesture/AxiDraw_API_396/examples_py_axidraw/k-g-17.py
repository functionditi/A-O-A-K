import random
import math
import serial
import sys
import select
from pyaxidraw import axidraw

# --- Conversion and Tolerance Helpers ---
PIXELS_PER_INCH = 100.0
def to_inches(p):
    return p / PIXELS_PER_INCH

def approx_equal(a, b, tol=5.0):
    return abs(a - b) < tol

# Non-blocking keyboard check (for serial-only mode)
def check_keyboard():
    dr, _, _ = select.select([sys.stdin], [], [], 0)
    if dr:
        return sys.stdin.readline().strip()
    return None

# --- Global DFS Variables ---2
# Grid settings: size = 3 (3x3 grid) with spacing = 50.
size = 8
pullis = []         # List of all grid dots (instances of Dot)
framework = []      # Each edge: { 'x': currentIndex, 'y': nextIndex, 'reverse': bool, 'vector': {dx,dy} }
capArcs = []        # Cap arcs drawn when terminating a branch.
startingPoints = [0]  # Dot 0 is the initial starting point.

spacing = 50

dfsStack = []       # Current DFS stack (list of indices)
visited = set()     # Set of visited dot indices
lastVector = None   # Most recent movement vector (dict: {dx, dy})

recent_update = None  # Record of the most–recent update (edge or arc)

# Global variable for the current AxiDraw instance.
current_ad = None

# --- Dot Class ---
class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# --- DFS Setup ---
def resetPattern():
    global pullis, framework, dfsStack, visited, lastVector, capArcs, recent_update, startingPoints
    pullis = []
    framework.clear()
    dfsStack.clear()
    visited.clear()
    capArcs.clear()
    lastVector = None
    recent_update = None
    startingPoints[:] = [0]
    for i in range(size):
        for j in range(size):
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

# --- DFS Branch Functions ---
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
        if current_ad is not None:
            terminateBranch_interactive(current_ad)
        else:
            terminateBranch()

def terminateBranch():
    # Non-interactive fallback.
    global dfsStack, lastVector, recent_update, startingPoints
    if not dfsStack:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    r_angle = math.atan2(lastVector['dy'], lastVector['dx']) + math.pi if lastVector else 0
    stop_angle = math.pi * 9 / 4 if len(dfsStack) == 1 else math.pi * 7 / 4
    cap_info = {'dot': currentDot, 'angle': r_angle, 'start': math.pi/4, 'stop': stop_angle}
    capArcs.append(cap_info)
    recent_update = {'type': 'arc', 'arc': cap_info}
    dfsStack.clear()
    lastVector = None
    unvisitedIndices = [i for i in range(len(pullis)) if i not in visited]
    if unvisitedIndices:
        newSource = random.choice(unvisitedIndices)
        visited.add(newSource)
        dfsStack.append(newSource)
        startingPoints.append(newSource)
        print(startingPoints)
    else:
        print("All dots visited.")

def addEdge(currentIndex, nextIndex, vector):
    global lastVector, recent_update
    framework.append({'x': currentIndex, 'y': nextIndex, 'reverse': False, 'vector': vector})
    visited.add(nextIndex)
    dfsStack.append(nextIndex)
    lastVector = vector
    recent_update = {'type': 'edge', 'edge': {'currentIndex': currentIndex, 'nextIndex': nextIndex, 'vector': vector}}

def addReverseEdge(currentIndex, parentIndex, vector):
    global lastVector, recent_update
    framework.append({'x': currentIndex, 'y': parentIndex, 'reverse': True, 'vector': vector})
    lastVector = vector
    recent_update = {'type': 'edge', 'edge': {'currentIndex': currentIndex, 'nextIndex': parentIndex, 'vector': vector}}

def terminateBranch_interactive(ad):
    global dfsStack, lastVector, recent_update, startingPoints
    if not dfsStack:
        return
    currentIndex = dfsStack[-1]
    currentDot = pullis[currentIndex]
    r_angle = math.atan2(lastVector['dy'], lastVector['dx']) + math.pi if lastVector else 0
    stop_angle = math.pi * 9 / 4 if len(dfsStack) == 1 else math.pi * 7 / 4
    cap_info = {'dot': currentDot, 'angle': r_angle, 'start': math.pi/4, 'stop': stop_angle}
    capArcs.append(cap_info)
    recent_update = {'type': 'arc', 'arc': cap_info}
    send_recent_update_to_axidraw(ad)
    # Reverse the branch as in the original code:
    while len(dfsStack) > 1:
        childIndex = dfsStack.pop()
        parentIndex = dfsStack[-1]
        childDot = pullis[childIndex]
        parentDot = pullis[parentIndex]
        reverseVector = {'dx': (parentDot.x - childDot.x) / spacing,
                         'dy': (parentDot.y - childDot.y) / spacing}
        addReverseEdge(childIndex, parentIndex, reverseVector)
        send_recent_update_to_axidraw(ad)
    dfsStack.clear()
    lastVector = None
    unvisitedIndices = [i for i in range(len(pullis)) if i not in visited]
    if unvisitedIndices:
        newSource = random.choice(unvisitedIndices)
        visited.add(newSource)
        dfsStack.append(newSource)
        startingPoints.append(newSource)
    else:
        print("All dots visited.")

# --- Interactive Decoration Functions (AxiDraw commands) ---
def interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing_val, reverse, ad):
    if approx_equal(angleDegrees, 90) or approx_equal(angleDegrees, -90):
        angle = (3 * math.pi/4 if reverse else math.pi/4)
    else:
        angle = (math.pi/4 if reverse else 3 * math.pi/4)
    lineLength = spacing_val * 0.33
    x1 = tempX - math.cos(angle) * lineLength
    y1 = tempY - math.sin(angle) * lineLength
    x2 = tempX + math.cos(angle) * lineLength
    y2 = tempY + math.sin(angle) * lineLength
    ad.moveto(to_inches(x1), to_inches(y1))
    ad.lineto(to_inches(x2), to_inches(y2))

def interactive_loop_around(dot, theAngle, start, stop, ad, segments=15):
    r = (spacing * 0.66) / 2
    pts = []
    for i in range(segments + 1):
        theta = start + (stop - start) * i / segments
        lx = r * math.cos(theta)
        ly = r * math.sin(theta)
        rx = math.cos(theAngle) * lx - math.sin(theAngle) * ly
        ry = math.sin(theAngle) * lx + math.cos(theAngle) * ly
        abs_x = dot.x + rx
        abs_y = dot.y + ry
        pts.append((abs_x, abs_y))
    ad.moveto(to_inches(pts[0][0]), to_inches(pts[0][1]))
    for (x, y) in pts[1:]:
        ad.lineto(to_inches(x), to_inches(y))

def interactive_apply_loop_and_stroke(aDiff, r_angle, dot, ad):
    if approx_equal(aDiff, 0):
        interactive_loop_around(dot, r_angle, math.pi/4, math.pi*3/4, ad)
    elif approx_equal(aDiff, -90) or approx_equal(aDiff, 270):
        interactive_loop_around(dot, r_angle, math.pi/4, math.pi*5/4, ad)
    elif approx_equal(aDiff, 90) or approx_equal(aDiff, -270):
        interactive_loop_around(dot, r_angle + math.pi/2, math.pi/4, math.pi*5/4, ad)

# --- Send Recent Update to AxiDraw ---
def send_recent_update_to_axidraw(ad):
    if recent_update is None:
        return
    if recent_update['type'] == 'edge':
        i = len(framework) - 1
        edge = framework[i]
        dot1 = pullis[edge['x']]
        dot2 = pullis[edge['y']]
        tempX = (dot1.x + dot2.x) / 2
        tempY = (dot1.y + dot2.y) / 2
        r_angle = math.atan2(dot2.y - dot1.y, dot2.x - dot1.x)
        angleDegrees = math.degrees(r_angle)
        if edge['x'] in startingPoints:
            interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
            interactive_loop_around(dot1, r_angle, math.pi/4, math.pi*7/4, ad)
        else:
            prev_edge = framework[i-1]
            prev_dot1 = pullis[prev_edge['x']]
            prev_dot2 = pullis[prev_edge['y']]
            prev_r_angle = math.atan2(prev_dot2.y - prev_dot1.y, prev_dot2.x - prev_dot1.x)
            prevA = math.degrees(prev_r_angle)
            aDiff = angleDegrees - prevA
            if (i % 2) == 1:
                if not (approx_equal(aDiff, 90) or approx_equal(aDiff, -270)):
                    # interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=False, ad=ad)
                # else:
                    interactive_apply_loop_and_stroke(aDiff, r_angle, dot1, ad)
                interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=False, ad=ad)
            else:
                if approx_equal(aDiff, 90) or approx_equal(aDiff, -270):
                    interactive_apply_loop_and_stroke(aDiff, r_angle, dot1, ad)
                    # interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
                # elif approx_equal(aDiff, -90) or approx_equal(aDiff, 270):
                #     interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)
                elif approx_equal(aDiff, 0):
                    interactive_apply_loop_and_stroke(0, r_angle + math.pi, dot1, ad)
                interactive_draw_diagonal_line(angleDegrees, tempX, tempY, spacing, reverse=True, ad=ad)

    elif recent_update['type'] == 'arc':
        arc = recent_update['arc']
        interactive_loop_around(arc['dot'], arc['angle'], arc['start'], arc['stop'], ad)

# --- Draw Base Grid ---
def draw_base_grid(ad):
    marker_length = 1
    for dot in pullis:
        ad.moveto(to_inches(dot.x), to_inches(dot.y))
        ad.lineto(to_inches(dot.x + marker_length), to_inches(dot.y))
    print("Base grid drawn.")

# --- Serial-Only Mode ---
def serial_only_mode(ad):
    print("Entering serial-only mode (listening for Arduino gestures).")
    try:
        ser = serial.Serial('/dev/tty.usbmodem1401', 9600, timeout=0.1)
    except Exception as e:
        print("Could not open serial port:", e)
        return
    while True:
        kb = check_keyboard()
        if kb is not None and kb.lower() == "q":
            break
        if ser.in_waiting:
            line = ser.readline().decode().strip()
            if line:
                print("Arduino gesture:", line)
                if line == "1":
                    extendSameDirection()
                elif line == "0":
                    terminateBranch_interactive(ad)
                elif line == "2":
                    extendTurn()
                send_recent_update_to_axidraw(ad)
        # Loop continuously.
    ser.close()
    print("Exiting serial-only mode.")

# --- Main Interactive Loop ---
def interactive_loop():
    resetPattern()
    global current_ad
    ad = axidraw.AxiDraw()
    current_ad = ad
    ad.interactive()
    if not ad.connect():
        print("AxiDraw not connected.")
        return
    # Speed settings.
    ad.options.speed_pendown = 70
    ad.options.speed_penup = 120
    ad.options.accel = 100
    ad.options.home_after = False
    draw_base_grid(ad)
    print("Interactive DFS AxiDraw generator with branch reversal and decorations")
    print("Commands:")
    print("  1: Extend in same direction (Arduino '1' gives same)")
    print("  2: Extend with a turn (Arduino '2' gives turn, '0' now terminates branch)")
    print("  0: Terminate branch (reverse branch with decorations) [Keyboard only]")
    print("  s: Enter serial-only mode")
    print("  p: Render permanent decorations to AxiDraw")
    print("  q: Quit (press q twice to exit completely)")
    
    try:
        ser = serial.Serial('/dev/tty.usbmodem1401', 9600, timeout=0.5)
        print("Opened serial on /dev/tty.usbmodem1401 at 9600 baud.")
    except Exception as e:
        print("Could not open serial port:", e)
        ser = None

    while True:
        # Process serial input.
        if ser and ser.in_waiting:
            line = ser.readline().decode().strip()
            if line:
                print("Arduino gesture:", line)
                if line == "1":
                    extendSameDirection()
                elif line == "0":
                    terminateBranch_interactive(ad)
                elif line == "2":
                    extendTurn()
                send_recent_update_to_axidraw(ad)
        # Check for manual keyboard input.
        cmd = input("Enter command (or press Enter to skip): ").strip()
        if cmd == "1":
            extendSameDirection()
        elif cmd == "2":
            extendTurn()
        elif cmd == "0":
            terminateBranch_interactive(ad)
            continue
        elif cmd == "s":
            serial_only_mode(ad)
            print("Returning to main menu.")
            continue
        elif cmd == "q":
            confirm = input("Press q again to exit completely, or any key to return: ").strip()
            if confirm.lower() == "q":
                print("Homing AxiDraw...")
                ad.penup()
                ad.moveto(0, 0)  # Home the machine: move to (0,0) and raise pen.
                print("Exiting.")
                break
            else:
                continue
        elif cmd != "":
            print("Unknown command.")
            continue
        send_recent_update_to_axidraw(ad)
    ad.disconnect()
    if ser:
        ser.close()

def draw_base_grid(ad):
    marker_length = 1
    for dot in pullis:
        ad.moveto(to_inches(dot.x), to_inches(dot.y))
        ad.lineto(to_inches(dot.x + marker_length), to_inches(dot.y))
    print("Base grid drawn.")

def main():
    interactive_loop()

if __name__ == "__main__":
    main()
