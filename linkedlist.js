class LinkedList {
    constructor() {
        this.length = 0;
        this.nextId = 0;
        this.first = null;
        this.last = null;
    }
    addFirst(value) {
        let id = this.nextId++;
        let node = { value, id, next: this.first };

        // Edge case where the list is initially empty
        if (this.last === null) {
            this.last = node;
        } 

        this.first = node;
        return id;

    }

    addLast(value) {
        let id = this.nextId++;
        let node = { value, id, next: null };

        // Edge case where the list is initially empty
        if (this.first === null) {
            this.first = node;
        } else {
            this.last.next = node;
        }

        this.last = node;
        return id;
    } 

    // Insert value before the first node for which the predicate is true or last
    insertBeforePredicate(value, predicate) {
        if (this.first == null) return this.addLast(value);
        if (predicate(this.first.value)) return this.addFirst(value);

        let prev = this.first;
        let next = prev.next;
        while (next != null && !predicate(next.value)) {
            prev = next;
            next = prev.next;
        }
        this.addAfter(value, prev);
    }

    addAfter(value, node) {
        // if (node == null) return this.addLast(value);
        let id = this.nextId++;
        let newNode = { value, id, next: node.next };
        node.next = newNode;
    }

    // Find the last node for which the predicate is true
    findLast(predicate) {
        if (this.first == null) return null;
        let result = null;

        let current = this.first;
        while (current != null) {
            if (predicate(current.value)) {
                result = current;
            }

            current = current.next;
        }

        return result;
    }
    
    forEach(callback) {
        let current = this.first;
        while (current != null) {
            callback(current.value)
            current = current.next;
        }
    }
    
    remove(id) {
        // Bit of annoying pointer management since this is not a doubly-linked list
        // Edge case where no are registered
        if (this.first === null) return null;

        // Edge case where we remove the first animation
        let previous = this.first;
        if (previous.id === id) {
            if (this.last.id === id) { // Edge case where there is only one element 
                this.last = null;
                this.first = null;
            }
            else {
                this.first = previous.next; // Update first pointer
            }
            return previous.value; 
        }

        // General case where we loop through elements
        let current = previous.next;
        while (current !== null) {
            if (current.id === id) {
                if (this.last.id === id) {
                    this.last = previous;
                }
                previous.next = current.next; // Update pointer to skip over current element
                return current.value;
            }
            previous = current;
            current = current.next;
        }
        return null;
    }
    *items() {
        let current = this.first;
        while (current !== null) {
            yield current.value;
            current = current.next;
        }
    }

}