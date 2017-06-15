# Spitfire.js

A tiny reactive data model library.

## Requirements

- [RxJS](https://github.com/ReactiveX/rxjs)

## Installation

```
npm install rxjs
npm install spitfirejs
```

## API

### Model.constructor([source])

Convenience class for extension and lazy model transformation. A `Model` instance gets transformed into a reactive data model when its prototype property `state$` is called for the first time. If a `source` object is available in the constructor, its own enumerable properties are copied onto the new `Model` instance.

### Model.transform(source)

Transforms the `source` object into a reactive model by redefining its own enumerable non-function properties into proxies which handle values via getters and setters using RxJS `BehaviorSubject` instances. The combined latest properties are accessible via the `state$` property, an RxJS `Observable` stream of previous and next states. 
Returns the frozen `source` object.

## Initialization

### Convenience class (lazy)

```javascript
import {Model} from 'spitfirejs'

const model = new Model({foo: 'bar'})  // => Model { foo: 'bar' }

model.hasOwnProperty('state$')  // => false; the model is not transformed yet
model.state$  // => Observable<object>; the property `state$` gets called for the first time
model.hasOwnProperty('state$')  // => true; the model is now transformed
```

### Mutating method

```javascript
import {Model} from 'spitfirejs'

const source = { foo: 'bar' }
const model = Model.transform(source)  // => Object { foo: 'bar' }

model === source  // => true; the original source object is transformed into a model
model.hasOwnProperty('state$')  // => true; the model is immediately transformed
```

## Usage

The reactive data model can be used to store any data and immediately notify its `state$` observers of any state changes. A simple example:

```javascript
import {Model} from 'spitfirejs'

class Counter extends Model {
    constructor() {
        super()
        this.count = 0
    }
    
    increment() {
        this.count += 1
    }
    
    decrement() {
        this.count -= 1
    }
}

const counter = new Counter()  // => Counter { count: 0 }

const subscriber1 = counter.state$.subscribe(state => {
    console.log(state.next.count) 
})  // `0` is logged on subscription
counter.increment()  // `1` is logged on change
counter.decrement()  // `0` is logged on change 

subscriber1.unsubscribe()
counter.increment()  // the count is incremented, but nothing is logged because there are no subscribers
const subscriber2 = counter.state$.subscribe(state => {
    console.log(state.next.count)
}  // `1` is logged on subscription
```

Since each `state$` property is a regular RxJS `Observable` instance, they can be used with any RxJS operators, e.g. for filtering, transforming or combining multiple states. An example:

```javascript
import {Model} from 'spitfirejs'
import {Observable} from 'rxjs/Observable'
import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/operators/map'
import 'rxjs/add/operators/filter'

class Movie extends Model {
    constructor(name) {
        super()
        this.name = name
        this.lastWatched = null
    }
    
    watch() {
        this.lastWatched = new Date()
    }
}

const movie1 = new Movie("Monty Python and the Holy Grail")
const movie2 = new Movie("Monty Python's Life of Brian")
const movie3 = new Movie("Monty Python's The Meaning of Life")

// Observe the order of watched movies when all movies have been watched at least once
Observable.combineLatest(movie1.state$, movie2.state$, movie3.state$)
    .map(states => states.map(state => state.next))  // Discard the previous state
    .filter(movies => movies.every(movie => movie.lastWatched))  // Proceed only if all movies have been watched
    .map(movies => movies.sort((a, b) => {
        switch (true) {
        case a.lastWatched > b.lastWatched:
            return 1
        case a.lastWatched < b.lastWatched:
            return -1
        default:
            return 0
        }
    }))  // Sort movies by the time they were last watched
    .map(movies => movies.map(movie => movie.name))  // Take only movie names
    .subscribe(watchOrder => {
        console.log(watchOrder)
    })

movie1.watch()  // Nothing happens, because not all movies have been watched yet
movie2.watch()  // Nothing happens, because not all movies have been watched yet
movie3.watch()  // ["Monty Python and the Holy Grail", "Monty Python's Life of Brian", "Monty Python's The Meaning of Life"]
movie2.watch()  // ["Monty Python and the Holy Grail", "Monty Python's The Meaning of Life", "Monty Python's Life of Brian"]
movie1.watch()  // ["Monty Python's The Meaning of Life", "Monty Python's Life of Brian", "Monty Python and the Holy Grail"]
```

## Resources
- [RxJS operators](https://www.learnrxjs.io/#operators)

