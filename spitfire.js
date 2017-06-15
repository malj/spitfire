;(function (global, factory) {
    /* istanbul ignore next */
    if (typeof exports === 'object') {
        var Rx = {
            Observable: require('rxjs/Observable').Observable,
            BehaviorSubject: require('rxjs/BehaviorSubject').BehaviorSubject
        }
        require('rxjs/add/observable/combineLatest')

        module.exports = factory(Rx)
    }
    else if (typeof define === 'function' && define.amd) {
        define('spitfire', ['rxjs'], factory)
    }
    else {
        global.spitfire = factory(global.Rx)
    }
}(this, function (Rx) {

    function Model(source) {
        if (!(this instanceof Model)) {
            throw new TypeError('Cannot call class Model as as function')
        }

        var hasSource = typeof source !== 'undefined'
        var isSourceValid = typeof source === 'object' && source !== null

        if (hasSource) {
            if (!isSourceValid) {
                throw new TypeError('Model source must be an object')
            }

            Object.keys(source).reduce(function (model, key) {
                model[key] = source[key]
                return model
            }, this)
        }
    }

    function createProxy(source, key) {
        var subject = new Rx.BehaviorSubject(source[key])

        Object.defineProperty(source, key, {
            configurable: false,
            get: function () {
                return subject.value
            },
            set: function (value) {
                subject.next(value)
            }
        })

        return subject.asObservable()
    }

    Model.transform = function (source) {
        if (typeof source !== 'object' || source === null) {
            throw new TypeError('Cannot transform a non-object into a model')
        }

        var keys = Object.keys(source).filter(function (key) {
            return typeof source[key] !== 'function'
        })
        
        var prev = keys.reduce(function (state, key) {
            state[key] = null
            return state
        }, {})
        
        var proxies = keys.map(function (key) {
            return createProxy(source, key)
        })
        .concat(function () {
            var values = Array.prototype.slice.call(arguments)
            
            var next = values.reduce(function (state, value, i) {
                var key = keys[i]
                state[key] = value
                return state
            }, {})
            
            var state = {
                prev: prev,
                next: next
            }
            
            prev = next
            return state
        })

        var state$ = Rx.Observable.combineLatest.apply(null, proxies)

        Object.defineProperty(source, 'state$', {
            value: state$
        })

        return Object.freeze(source)
    }

    Object.defineProperty(Model.prototype, 'state$', {
        get: function () {
            if (this instanceof Model) {
                return Model.transform(this).state$
            }
        }
    })

    return {
        Model: Model
    }
}));
