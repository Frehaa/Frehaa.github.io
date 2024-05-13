class _PQItem { // Creating objects seems like a dumb way to do this instead of just having two arrays
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
class IndexedMinPriorityQueue {
    constructor(size) {
        this._pq = [];          // 1 based indexing priority queue
        this._items = [];   // Items based on index
        this._qp = []       // Inverse of pq. I.e. _pq[k] = t  <=>  _qp[t] = k
        this._size = 0;

        for (let i = 0; i <= size; i++) {
            this._pq.push(null); 
            this._items.push(null);
            this._qp.push(-1);
        }
    }
    size() {
        return this._size;
    }
    // Is responsible for checking that the index is correct for other methods.
    contains(index) { // Assuming index is an integer.
        if (index < 0 || index >= this._pq.length-1) throw new Error('Index out of bound.')
        return this._qp[index] !== -1;
    }
    add(index, value, priority) { 
        // Index check is made in the 'contains' call.
        if (this.contains(index)) throw new Error('The index already has an item assigned.')
        this._size += 1
        this._items[index] = new _PQItem(value, priority);
        this._qp[index] = this._size
        this._pq[this._size] = index;
        this._swim(this._size);
    }
    change(index, value, priority) {
        if (!this.contains(index)) throw new Error('The index does not have an item assigned.')
        
        this._items[index].value = value;
        this._items[index].priority = priority;

        const pqIndex = this._qp[index];
        this._swim(pqIndex);
        this._sink(pqIndex);
    }
    removeMin() {
        if (this._size === 0) return null;
        // If the size is non-zero, then the invariant is that the minimum element is at index 1
        const minItemIndex = this._pq[1];
        const returnResult = this._items[minItemIndex].value; // Keep reference to item to return

       // Take the item at the last position in the priority queue and put it in position 1
        this._swap(1, this._size);

        // remove old item's bookkeeping 
        this._items[minItemIndex] = null;
        this._qp[minItemIndex] = -1;
        this._pq[this._size] = null;
 
        // Update size and sink the swapped element
        this._size -= 1
        this._sink(1);
        return returnResult;
    }
    _swim(index) {
        if (index <= 1) return;
        const k = index/2 | 0;// "| 0" for integer division
        if (this._lessThan(index, k)) {
            this._swap(index, k);
            this._swim(k);
        }

    }
    _sink(index) { // When sinking, we shouldn't just take try the left and then the right. If both exists, then we should swap with the smaller
        const k = index * 2; // Left child index. Right child index is k + 1
        if (k > this._size) return; // If left is null then we are a leaf and do not need to go further

        // If (right child is null OR left is smaller than right) AND left child is less than current
        if (((k + 1) > this._size || this._lessThan(k, k+1)) && this._lessThan(k, index)) { 
            this._swap(index, k);
            return this._sink(k);
        } else if ((k+1) <= this._size && this._lessThan(k + 1, index)) { // Otherwise, if right child is not null and is smaller than current
            this._swap(index, k+1);
            return this._sink(k+1);
        }
    }
    _swap(index1, index2) {
        const tmpPq = this._pq[index1];
        this._pq[index1] = this._pq[index2];
        this._pq[index2] = tmpPq;

        index1 = this._pq[index1];
        index2 = this._pq[index2];
        const tmpQp = this._qp[index1];
        this._qp[index1] = this._qp[index2]; 
        this._qp[index2] = tmpQp;
    }
    // Assumes that the indices are in valid range and that they point to items
    _lessThan(index1, index2) {
        const left = this._items[this._pq[index1]];
        const right = this._items[this._pq[index2]];
        return left.compareTo(right) === -1;
    }

}
class MinPriorityQueue {
    constructor() {
        this._items = [null];
        this._size = 0;
    }
    size() {
        return this._size;
    }
    add(item, priority) {
        this._items.push(new _PQItem(item, priority));
        this._swim(this._items.length-1);
        this._size += 1
    }
    removeMin() {
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
        // TODO: FIX if needed
    }
    _swap(index1, index2) {
        const tmp = this._items[index1];
        this._items[index1] = this._items[index2];
        this._items[index2] = tmp;
    }
}

function testMinPriorityQueue() {
    testMinPQAddingInIncreasingOrder();
    testMinPQAddingInDecreasingOrder();
    testMinPQRemovingEmpty();
    testMinPQAddAndRemovingEmpty();
}

function assertEqual(result, expected, msg) {
    if (result !== expected) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`)
}
function assertError(functionCall, errorCall, msg) {
    let functionErrored = false;
    try {
        functionCall();
    } catch (e) {
        functionErrored = true;
        if (!errorCall(e)) throw new Error(msg);
    }
    if (functionErrored === false) throw new Error(msg);
}

function testMinPQAddingInIncreasingOrder() {
    const pq = new MinPriorityQueue();
    pq.add(1, 1);
    pq.add(2, 2);
    pq.add(3, 3);
    pq.add(4, 4);

    const res1 = pq.removeMin();
    const res2 = pq.removeMin();
    const res3 = pq.removeMin();
    const res4 = pq.removeMin();
    const errorMessage = 'testAddingInIncreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function testMinPQAddingInDecreasingOrder() {
    const pq = new MinPriorityQueue();
    pq.add(4, 4);
    pq.add(3, 3);
    pq.add(2, 2);
    pq.add(1, 1);

    const res1 = pq.removeMin();
    const res2 = pq.removeMin();
    const res3 = pq.removeMin();
    const res4 = pq.removeMin();
    const errorMessage = 'testAddingInDecreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function testMinPQRemovingEmpty() {
    const pq = new MinPriorityQueue();
    const res = pq.removeMin();
    assertEqual(res, null, 'testRemovingEmpty failed');
}

function testMinPQAddAndRemovingEmpty() {
    const pq = new MinPriorityQueue();
    pq.add(1,1);
    pq.removeMin();
    const res = pq.removeMin();
    assertEqual(res, null, 'testAddAndRemovingEmpty failed');
}



function testIndexedMinPriorityQueue() {
    const tests = [
    test_IMPQ_add_increasing_order,
    test_IMPQ_add_decreasing_order,
    test_IMPQ_remove_empty_returns_null,
    test_IMPQ_add_once_remove_twice_returns_null,
    test_IMPQ_add_changing_order_changes_size,
    test_IMPQ_add_decreasing_order_changes_size,    
    test_IMPQ_add_increasing_order_changes_size,
    test_IMPQ_add_more_than_size_makes_error,
    test_IMPQ_add_negative_outside_index_bound_makes_error,
    test_IMPQ_add_positive_outside_index_bound_makes_error,
    test_IMPQ_add_same_index_makes_error,
    test_IMPQ_add_same_priority_items_maintains_order,
    test_IMPQ_removeMin_left_vs_right,
    test_IMPQ_removeMin_then_change_swapped_element,
    test_IMPQ_change_item_to_min_expect_new_min_on_removal,
    test_IMPQ_change_non_existing_element_index_expect_error,
    test_IMPQ_change_out_of_bound_index_expect_error,
    test_IMPQ_change_min_expect_new_value_on_removal,
    test_IMPQ_add_remove_random_tests,
    ];
    for (let i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log(tests[i].name + " success");
        } catch (e) {
            console.log(e);
        }
    }
}

function test_IMPQ_add_increasing_order() {
    const pq = new IndexedMinPriorityQueue(5);
    pq.add(1, 1, 1);
    pq.add(2, 2, 2);
    pq.add(3, 3, 3);
    pq.add(4, 4, 4);

    const res1 = pq.removeMin();
    const res2 = pq.removeMin();
    const res3 = pq.removeMin();
    const res4 = pq.removeMin();
    const errorMessage = 'testAddingInIncreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function test_IMPQ_add_decreasing_order() {
    const pq = new IndexedMinPriorityQueue(5);
    pq.add(4, 4, 4);
    pq.add(3, 3, 3);
    pq.add(2, 2, 2);
    pq.add(1, 1, 1);

    const res1 = pq.removeMin();
    const res2 = pq.removeMin();
    const res3 = pq.removeMin();
    const res4 = pq.removeMin();
    const errorMessage = 'testAddingInDecreasingOrder: Failed.';
    assertEqual(res1, 1, errorMessage);
    assertEqual(res2, 2, errorMessage);
    assertEqual(res3, 3, errorMessage);
    assertEqual(res4, 4, errorMessage);
}

function test_IMPQ_remove_empty_returns_null() {
    const pq = new IndexedMinPriorityQueue(4);
    const res = pq.removeMin();
    assertEqual(res, null, 'testRemovingEmpty failed');
}

function test_IMPQ_add_once_remove_twice_returns_null() {
    const pq = new IndexedMinPriorityQueue(4);
    pq.add(1, 1,1);
    pq.removeMin();
    const res = pq.removeMin();
    assertEqual(res, null, 'testAddAndRemovingEmpty failed');
}


// What tests do I want for my index based priority queue?


// What operations are there?
// 1. Add
// 2. remove
// 3. change

// Test that add changes size.
// What happens if we add the same thing?
// Are there any failure cases for add?
// Since we have bounded size, what happens if we add too much?

function test_IMPQ_add_increasing_order_changes_size(){
    const pq = new IndexedMinPriorityQueue(4);
    assertEqual(pq.size(), 0, 'test_IMPQ_add_increasing_order_changes_size failed');
    pq.add(0,0,0);
    assertEqual(pq.size(), 1, 'test_IMPQ_add_increasing_order_changes_size failed');
    pq.add(1,1,1);
    assertEqual(pq.size(), 2, 'test_IMPQ_add_increasing_order_changes_size failed');
    pq.add(2,2,2);
    assertEqual(pq.size(), 3, 'test_IMPQ_add_increasing_order_changes_size failed');
    pq.add(3,3,3);
    assertEqual(pq.size(), 4, 'test_IMPQ_add_increasing_order_changes_size failed');
}

function test_IMPQ_add_decreasing_order_changes_size(){
    const functionName = 'test_IMPQ_add_decreasing_order_changes_size';
    const pq = new IndexedMinPriorityQueue(7);
    assertEqual(pq.size(), 0, functionName +' failed');
    pq.add(4,4,4);
    assertEqual(pq.size(), 1, functionName +' failed');
    pq.add(3,3,3);
    assertEqual(pq.size(), 2, functionName +' failed');
    pq.add(2,2,2);
    assertEqual(pq.size(), 3, functionName +' failed');
    pq.add(1,1,1);
    assertEqual(pq.size(), 4, functionName +' failed');
    pq.add(0,0,0);
    assertEqual(pq.size(), 5, functionName +' failed');
}

function test_IMPQ_add_changing_order_changes_size(){
    const functionName = 'test_IMPQ_add_changing_order_changes_size';
    const pq = new IndexedMinPriorityQueue(5);
    assertEqual(pq.size(), 0, functionName +' failed');
    pq.add(2,2,2);
    assertEqual(pq.size(), 1, functionName +' failed');
    pq.add(3,3,3);
    assertEqual(pq.size(), 2, functionName +' failed');
    pq.add(0,0,0);
    assertEqual(pq.size(), 3, functionName +' failed');
    pq.add(1,1,1);
    assertEqual(pq.size(), 4, functionName +' failed');
    pq.add(4,4,4);
    assertEqual(pq.size(), 5, functionName +' failed');
}

function test_IMPQ_add_same_index_makes_error() {
    const functionName = 'test_IMPQ_add_changing_order_changes_size';
    const pq = new IndexedMinPriorityQueue(5);

    pq.add(1,1,1);

    assertError(() => {
        pq.add(1,1,1);
    }, (e) => {
        return true
    }, functionName + ' failed')
}


function test_IMPQ_add_positive_outside_index_bound_makes_error() {
    const functionName = 'test_IMPQ_add_positive_outside_index_bound_makes_error';
    const pq = new IndexedMinPriorityQueue(5);

    assertError(() => {
        pq.add(6,1,1);
    }, (e) => {
        return true
    }, functionName + ' failed')
}

function test_IMPQ_add_negative_outside_index_bound_makes_error() {
    const functionName = 'test_IMPQ_add_negative_outside_index_bound_makes_error';
    const pq = new IndexedMinPriorityQueue(5);

    assertError(() => {
        pq.add(-2,1,1);
    }, (e) => {
        return true
    }, functionName + ' failed')
}

function test_IMPQ_add_same_priority_items_maintains_order() {
    const functionName = 'test_IMPQ_add_same_priority_items_maintains_order';
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(0, 2, 2)
    pq.add(1, 3, 3)
    pq.add(2, 4, 4)
    pq.add(3, 2, 2)
    pq.add(4, 2, 2)
    pq.add(5, 2, 2)
    pq.add(6, 2, 2)

    assertEqual(pq.removeMin(), 2, functionName +' failed');
    assertEqual(pq.removeMin(), 2, functionName +' failed');
    assertEqual(pq.removeMin(), 2, functionName +' failed');
    assertEqual(pq.removeMin(), 2, functionName +' failed');
    assertEqual(pq.removeMin(), 2, functionName +' failed');
    assertEqual(pq.removeMin(), 3, functionName +' failed');
    assertEqual(pq.removeMin(), 4, functionName +' failed');
}

function test_IMPQ_add_more_than_size_makes_error() { 
// This seems superfluous because the only way to add more is to have all indices filled with more than 1 element
}

// TODO: Write test to make sure the order is maintained such that it is not just the left element which is 

function test_IMPQ_removeMin_left_vs_right() {
    const functionName = 'test_IMPQ_removeMin_left_vs_right';
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(0, 'a', 0)
    pq.add(1, 'c', 2)
    pq.add(2, 'b', 1)
    pq.add(3, 'd', 5)

    assertEqual(pq.removeMin(), 'a', functionName +' failed');
    assertEqual(pq.removeMin(), 'b', functionName +' failed');
    assertEqual(pq.removeMin(), 'c', functionName +' failed');
    assertEqual(pq.removeMin(), 'd', functionName +' failed');
}

function test_IMPQ_removeMin_then_change_swapped_element() {
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(0, 'a', 0)
    pq.add(1, 'c', 2)
    pq.add(2, 'b', 1)
    pq.add(3, 'd', 5)
    pq.removeMin(); // The previous error happened after a removeMin where _qp was not updated properly 

    pq.change(2, 'cc', 0);

    assertEqual(pq.removeMin(), 'cc', '');
}

function test_IMPQ_change_out_of_bound_index_expect_error() {
    const functionName = 'test_IMPQ_change_out_of_bound_index_expect_error';
    const pq = new IndexedMinPriorityQueue(7);

    assertError(() => {
        pq.change(-1, 1, 1);
    }, (e) => true, functionName + ' failed');
    assertError(() => {
        pq.change(7, 1, 1);
    }, (e) => true, functionName + ' failed');
}

function test_IMPQ_change_non_existing_element_index_expect_error() {
    const functionName = 'test_IMPQ_change_non_existing_element_index_expect_error';
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(3, 3, 3);

    assertError(() => {
        pq.change(1, 1, 1);
    }, (e) => true, functionName + ' failed');
    assertError(() => {
        pq.change(5, 1, 1);
    }, (e) => true, functionName + ' failed');
}

function test_IMPQ_change_item_to_min_expect_new_min_on_removal() {
    const functionName = 'test_IMPQ_change_item_to_min_expect_new_min_on_removal';
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(3, 3, 3);
    pq.add(2, 2, 2);
    pq.add(4, 4, 4);
    pq.add(5, 5, 5);
    pq.change(5, 5, 1);

    assertEqual(pq.removeMin(), 5, functionName +' failed');
    assertEqual(pq.removeMin(), 2, functionName +' failed');
}

function test_IMPQ_change_min_expect_new_value_on_removal() {
    const functionName = 'test_IMPQ_change_min_expect_new_value_on_removal';
    const pq = new IndexedMinPriorityQueue(7);
    pq.add(1, 1, 1);
    pq.add(2, 2, 2);
    pq.add(3, 3, 3);
    pq.add(4, 4, 4);
    pq.change(1, 5, 1)

    assertEqual(pq.removeMin(), 5, functionName +' failed');
}

function test_IMPQ_add_remove_random_tests() {
    const priorityQueueSize = 100;
    const numberOfTests = 1000;
    const functionName = 'test_IMPQ_add_remove_random_tests';

    for (let t = 0; t < numberOfTests; t++) {
        const pq = new IndexedMinPriorityQueue(priorityQueueSize);
        const values = []
        for (let i = 0; i < priorityQueueSize; i++) {
            values.push(i);
        }
        shuffle(values); // shuffle depends on math.js
        for (let i = 0; i < priorityQueueSize; i++) {
            pq.add(i, values[i], values[i]);
        }

        for (let i = 0; i < priorityQueueSize; i++) {
            assertEqual(pq.removeMin(), i, functionName + ' failed on input [' + values + ']');
        }
    }
 
}

function drawPriorityQueueArray(ctx, leftX, topY, width, height, array) {
    // TODO: Center Text

    ctx.font = '28px arial';
    ctx.strokeRect(leftX, topY, width, height);

    const offsetX = width / array.length;
    ctx.beginPath();
    for (let i = 1; i < array.length; i++) {
        ctx.moveTo(leftX + i * offsetX, topY);
        ctx.lineTo(leftX + i * offsetX, topY + height);
    }
    ctx.stroke();

    for (let i = 0; i < array.length; i++) {
        ctx.fillText(i, leftX + offsetX/2 + i * offsetX, topY - height / 2)
        ctx.fillText(array[i], leftX + offsetX/2 + i * offsetX, topY + height/2);
    }
}


function drawPriorityQueue(ctx, pq, drawSettings) {
    const { topLeft, size, offset} = drawSettings;

    drawPriorityQueueArray(ctx, topLeft.x, topLeft.y,               size.width, size.height, pq._items.map(item => item===null? null : (item.value + "[" + item.priority+"]")));
    drawPriorityQueueArray(ctx, topLeft.x, topLeft.y + offset + size.height,      size.width, size.height, pq._pq);
    drawPriorityQueueArray(ctx, topLeft.x, topLeft.y + 2 * (offset + size.height),  size.width, size.height, pq._qp);
    
    // TODO: Draw to the left the name of the array
    // TODO: draw indices above


}


// How are randomized tests made?
// How can we make property based tests?