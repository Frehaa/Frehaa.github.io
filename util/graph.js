function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

class Edge {
    constructor(a, b, weight) {
        this.a = a;
        this.b = b;
        this.weight = weight;
    }
    either() {
        return this.a;
    }
    other(n) {
        if (n === this.a) return this.b
        if (n === this.b) return this.a
        throw new Error("Invalid id: This edge does not have " + n + " as either endpoints");
    }
}

// What is better? A map or a linked list? I think it depends on the number of
// adjacent elements. For a very sparse graph, I can see a linked list being
// best. For a fully connected graph, a simple list/array would be best, and for
// something inbetween, a map is probably best.
// The reason we want a map is because we want to support removing edges which
// is expensive to do in a linked list if there are many edges
class Graph {
    constructor(size) {
        this.size = size;
        this.adjacencyMaps = [];
        for (let i = 0; i < size; i++) {
            this.adjacencyMaps.push(new Map());
        }
    }

    // Assumes 1. only one edge between two vertices. 2. that the edge is between the IDs of two valid nodes.  
    // Will crash if either endpoint of the edge is outside the range of the graph. 
    addEdge(edge) {
        this.adjacencyMaps[edge.a].set(edge.b, edge);
        this.adjacencyMaps[edge.b].set(edge.a, edge);
    }
    // Assumes that nodeA and nodeB are IDs of valid nodes
    // Will crash if either endpoint of the edge is outside the range of the graph. 
    removeEdge(nodeA, nodeB) {
        this.adjacencyMaps[nodeA].delete(nodeB);
        this.adjacencyMaps[nodeB].delete(nodeA);
    }

    // Assumes that nodeA and nodeB are IDs of valid nodes
    // Will crash if nodeA is outside the range of the graph
    getEdge(nodeA, nodeB) {
        return this.adjacencyMaps[nodeA].get(nodeB);
    }

    // Returns the edges connected to this node
    // Assumes that node is an IDs of a valid node
    // Will crash if node is outside the range of the graph
    *nodeEdges(node) {
        for (const edge of this.adjacencyMaps[node].values()) {
            yield edge
        }
    }
}

// REQUIRES priority_queue.js: MinPriorityQueue
// Start and end are given as indices / ids from 0 to graph.size - 1
function dijkstraShortestPath(graph, start, end) { // Returns a path 
    assert(graph instanceof Graph, 'Expected first argument to be an instance of Graph.');
    const distanceToNode = [];
    const shortestPathEdgeToNode = [];
    for (let i = 0; i < graph.size; i++) {
        distanceToNode.push(Infinity);
        shortestPathEdgeToNode.push(i);
    }

    const pq = new IndexedMinPriorityQueue(graph.size);
    pq.add(start, start, 0);
    distanceToNode[start] = 0;

    while (pq.size() > 0) {
        const node = pq.removeMin();
        if (node === end) {
            return _dijkstraShortestPathCreatePath(shortestPathEdgeToNode, start, end);
        } 
        _dijkstraShortestPathRelax(graph, node, pq, distanceToNode, shortestPathEdgeToNode);
    }

    return [];
}

function _dijkstraShortestPathCreatePath(shorestPathEdgeToNode, start, end) {
    const result = [];
    let current = end;
    while (current !== start) {
        assert(shorestPathEdgeToNode[current] !== current, "Found an unexpected self-loop in pathArray");
        result.unshift(current);
        current = shorestPathEdgeToNode[current];
    }
    result.unshift(start);
    return result;
}

function _dijkstraShortestPathRelax(graph, vertex, pq, distTo, edgeTo) {
    for (const edge of graph.nodeEdges(vertex)) {
        assert(edge.weight >= 0, "Graph edges should have non-negative weight.");
        const other = edge.other(vertex);
        if (distTo[other] > distTo[vertex] + edge.weight) {
            distTo[other] = distTo[vertex] + edge.weight; 
            edgeTo[other] = vertex;
            if (pq.contains(other)) {
                pq.change(other, other, distTo[other]);
            } else {
                pq.add(other, other, distTo[other]);
            }
        }
    }

}


function assertEqual(result, expected, msg) {
    if (result !== expected) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`);
}

function assertListEqualSimple(result, expected, msg) {
    if (result.length !== expected.length) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`);

    for (let i = 0; i < result.length; i++) {
        const a = result[i];
        const b = expected[i]
        if (a !== b) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`);
    }
}

function assertListEqualComparator(result, expected, comparator, msg) {
    if (result.length !== expected.length) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`);

    for (let i = 0; i < result.length; i++) {
        const a = result[i];
        const b = expected[i]
        if (!comparator(a, b)) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`);
    }
}

function assertError(functionCall, errorCall, msg) {
    let functionErrored = false;
    let result = null;
    try {
        result = functionCall();
    } catch (e) {
        functionErrored = true;
        if (!errorCall(e)) throw new Error(msg);
    }
    if (functionErrored === false) throw new Error(msg + ` - Expected error but got value (${result}) [${typeof result}]`);
}

function testDijkstraShortestPath() {
    const tests = [
        test_DSP_unconnected_returns_empty_path,
        test_DSP_isolated_end_returns_empty_path,
        test_DSP_disconnected_end_returns_empty_path,
        test_DSP_same_start_and_end_returns_path_with_start,
        test_DSP_negative_weight_edge_throws_error,
        test_DSP_straight_line_graph_give_straight_line_path,
        test_DSP_forked_graph_gives_shortest_path,
        test_DSP_fully_connected_graph_finds_long_shortest_path,
        test_DSP_random_graph_finds_shortest_path
    ];
    for (let i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log(`Test ${tests[i].name} success`)
        } catch (e) {
            console.log(e);
        }
    }

}

function test_DSP_unconnected_returns_empty_path(){
    const g = new Graph(20);
    const result = dijkstraShortestPath(g, 0, 10);
    assertListEqualSimple(result, [], '');
}

function test_DSP_isolated_end_returns_empty_path() {
    const g = new Graph(5);
    g.addEdge(new Edge(0, 1, 5));
    g.addEdge(new Edge(0, 2, 2));
    g.addEdge(new Edge(0, 3, 3));
    g.addEdge(new Edge(1, 2, 3));
    g.addEdge(new Edge(2, 3, 1));

    const result = dijkstraShortestPath(g, 0, 4);
    assertListEqualSimple(result, [], '');
}

function test_DSP_disconnected_end_returns_empty_path() {
    const g = new Graph(6);
    g.addEdge(new Edge(0, 1, 5));
    g.addEdge(new Edge(0, 2, 2));
    g.addEdge(new Edge(1, 2, 3));
    g.addEdge(new Edge(3, 4, 1));
    g.addEdge(new Edge(5, 4, 2));

    const result = dijkstraShortestPath(g, 0, 4);
    assertListEqualSimple(result, [], '');
}

function test_DSP_same_start_and_end_returns_path_with_start() {
    const g = new Graph(6);
    g.addEdge(new Edge(0, 1, 5));
    g.addEdge(new Edge(0, 2, 2));
    g.addEdge(new Edge(1, 2, 3));
    g.addEdge(new Edge(3, 4, 1));
    g.addEdge(new Edge(5, 4, 2));

    const result = dijkstraShortestPath(g, 2, 2);
    assertListEqualSimple(result, [2], '');
}

function test_DSP_negative_weight_edge_throws_error() {
    const g = new Graph(6);
    g.addEdge(new Edge(0, 1, 5));
    g.addEdge(new Edge(0, 2, 2));
    g.addEdge(new Edge(1, 2, 3));
    g.addEdge(new Edge(2, 3, -5));
    g.addEdge(new Edge(3, 4, 1));
    g.addEdge(new Edge(5, 4, 2));

    assertError(() => dijkstraShortestPath(g, 1, 5), e => true, ''); // Any error is fine
}

function test_DSP_straight_line_graph_give_straight_line_path() {
    const g = new Graph(4);
    g.addEdge(new Edge(0, 1, 5));
    g.addEdge(new Edge(1, 2, 2));
    g.addEdge(new Edge(2, 3, 1));

    const result = dijkstraShortestPath(g, 0, 3);
    assertListEqualSimple(result, [0, 1, 2, 3], '');
}

function test_DSP_forked_graph_gives_shortest_path() {
    //      A1  A2  ....  A3
    //  S   B1  B2  ....  B5    E
    //      C1  C2  ....  C6
    const g = new Graph(16);
    g.addEdge(new Edge(0, 1, 3));
    g.addEdge(new Edge(1, 2, 5));
    g.addEdge(new Edge(2, 3, 7));
    g.addEdge(new Edge(3, 15, 5)); // A path length 20

    g.addEdge(new Edge(0, 5, 5));
    g.addEdge(new Edge(5, 6, 4));
    g.addEdge(new Edge(6, 7, 3));
    g.addEdge(new Edge(7, 8, 2));
    g.addEdge(new Edge(8, 9, 4));
    g.addEdge(new Edge(9, 15, 1)); // B path length 19

    g.addEdge(new Edge(0, 4, 2));
    g.addEdge(new Edge(4, 10, 3));
    g.addEdge(new Edge(10, 11, 4));
    g.addEdge(new Edge(11, 12, 3));
    g.addEdge(new Edge(12, 13, 2));
    g.addEdge(new Edge(13, 14, 1));
    g.addEdge(new Edge(14, 15, 10)); // C path length 25

    const result = dijkstraShortestPath(g, 0, 15)
    assertListEqualSimple(result, [0, 5, 6, 7, 8, 9, 15], '');
}

function test_DSP_fully_connected_graph_finds_long_shortest_path() {
    const g = new Graph(5);
    g.addEdge(new Edge(0, 1, 10));
    g.addEdge(new Edge(0, 2, 3));
    g.addEdge(new Edge(0, 3, 1));
    g.addEdge(new Edge(0, 4, 12));

    g.addEdge(new Edge(1, 2, 2));
    g.addEdge(new Edge(1, 3, 7));
    g.addEdge(new Edge(1, 4, 10));

    g.addEdge(new Edge(2, 3, 5));
    g.addEdge(new Edge(2, 4, 8));

    g.addEdge(new Edge(3, 4, 2));

    const result = dijkstraShortestPath(g, 1, 4);
    assertListEqualSimple(result, [1, 2, 0, 3, 4], '');
}

function test_DSP_random_graph_finds_shortest_path() {
    // HOW SHOULD THE RANDOM GRAPH(S) LOOK?
    // One graph with multiple different weights?
}