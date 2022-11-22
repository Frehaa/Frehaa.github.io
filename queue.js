class LinkedList {
    constructor() {
        this.length = 0;
        this.nextId = 0;
        this.first = null;
        this.last = null;
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