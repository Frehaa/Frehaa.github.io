class PQItem {
    constructor(value, priority) {
        this.value = value;
        this.priority = priority;
    }
    compareTo(other) {
        if (this.priority > other.priority) return 1;
        if (this.priority < other.priority) return -1;
        return 0;
    }
}
class MinPriorityQueue {
    constructor() {
        this._items = [null];
        this._size = 0;
    }
    add(item, priority) {
        this._items.push(new PQItem(item, priority));
        this._swim(this._items.length-1);
        this._size += 1
    }
    remove() {
        if (this._size === 0) return null;
        this._swap(1, this._size);
        const item = this._items.pop();
        this._sink(1);
        this._size -= 1
        return item.value;
    }
    _swim(index) {
        if (index <= 1) return;
        const item = this._items[index];
        const other = this._items[index/2 | 0]; // "| 0" for integer division
        if (item.compareTo(other) === -1) {
            this._swap(index, index/2 | 0);
            this._swim(index/2 | 0);
        }

    }
    _sink(index) {
        const item = this._items[index];
        const left = this._items[index * 2];
        if (left === undefined) return;
        if (item.compareTo(left) === 1) {
            this._swap(index, index * 2);
            return this._sink(index * 2);
        }         

        const right = this._items[index * 2 + 1];
        if (right === undefined) return;
        if (item.compareTo(right) === 1) {
            this._swap(index, index * 2 + 1);
            return this._sink(index * 2 + 1);
        }
    }
    _swap(index1, index2) {
        const tmp = this._items[index1];
        this._items[index1] = this._items[index2];
        this._items[index2] = tmp;
    }
}

function testPriorityQueue() {
    testAddingInIncreasingOrder();
    testAddingInDecreasingOrder();
    testRemovingEmpty();
    testAddAndRemovingEmpty();
}

function assertEqual(result, expected, msg) {
    if (result !== expected) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`)
}

function testAddingInIncreasingOrder() {
    const pq = new MinPriorityQueue();
    pq.add(1, 1);
    pq.add(2, 2);
    pq.add(3, 3);
    pq.add(4, 4);

    const res1 = pq.remove();
    const res2 = pq.remove();
    const res3 = pq.remove();
    const res4 = pq.remove();
    const errorMessage = 'testAddingInIncreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function testAddingInDecreasingOrder() {
    const pq = new MinPriorityQueue();
    pq.add(4, 4);
    pq.add(3, 3);
    pq.add(2, 2);
    pq.add(1, 1);

    const res1 = pq.remove();
    const res2 = pq.remove();
    const res3 = pq.remove();
    const res4 = pq.remove();
    const errorMessage = 'testAddingInDecreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function testRemovingEmpty() {
    const pq = new MinPriorityQueue();
    const res = pq.remove();
    assertEqual(res, null, 'testRemovingEmpty failed');
}

function testAddAndRemovingEmpty() {
    const pq = new MinPriorityQueue();
    pq.add(1,1);
    pq.remove();
    const res = pq.remove();
    assertEqual(res, null, 'testAddAndRemovingEmpty failed');
}


