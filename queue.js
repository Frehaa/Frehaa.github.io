class Queue {
    constructor() {
        this.length = 0;
        this.first = null;
        this.last = null;
    }

    peek() {
        if (this.length == 0) {
            throw Error("No elements in queue.");
        }
        return this.first.value;
    }

    enqueue(item) {
        let newNode = { value: item, next: null };
        if (this.length == 0) {
            this.first = newNode;
        } else {
            this.last.next = newNode;
        }
        this.last = newNode;
        this.length++;
    }

    dequeue() {
        if (this.length == 0) {
            throw Error("No elements in queue.");
        }
        let result = this.first.value;
        this.first = this.first.next;
        this.length--;
        return result;
    }

}