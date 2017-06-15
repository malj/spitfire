const {expect} = require('chai')
const {Model} = require('./spitfire.js')
const {Observable} = require('rxjs/Observable')
require('rxjs/add/operator/skip')


describe('Model.constructor', () => {
    it('should create new Model instances', () => {
        const model = new Model()
        expect(model).to.be.an.instanceof(Model)
    })

    it('should throw if invoked without "new"', () => {
        expect(() => Model()).to.throw(TypeError)
    })

    it('should copy source object properties', () => {
        const model = new Model({foo: 'bar'})
        expect(model.foo).to.equal('bar')
    })

    it('should throw if passed a non-object source', () => {
        ['string', 1, true, new Function(), null].forEach(param => {
            expect(() => new Model(param)).to.throw(TypeError)
        })
    })

    it('should produce lazily activated models', () => {
        const model = new Model()
        expect(model.hasOwnProperty('state$')).to.equal(false)
        model.state$
        expect(model.hasOwnProperty('state$')).to.equal(true)
    })
})

describe('Model.transform', () => {
    it ('should be a static method', () => {
        expect(Model.hasOwnProperty('transform')).to.equal(true)
        expect(Model.transform).to.be.a('function')
    })

    it('should mutate the source object', () => {
        const source = {}
        const model = Model.transform(source)
        expect(model).to.equal(source)
    })

    it('should throw if passed a non-object source', () => {
        ['string', 1, true, new Function(), null, undefined].forEach(param => {
            expect(() => Model.transform(param)).to.throw(TypeError)
        })
    })

    it('should produce immediately activated models', () => {
        const model = Model.transform({})
        expect(model.hasOwnProperty('state$')).to.equal(true)
    })

    it('should ignore function properties', done => {
        const model = Model.transform({
            foo: 'bar', 
            myMethod: new Function()
        })
        model.state$.subscribe(state => {
            expect(state.next.myMethod).to.equal(undefined)
            done()
        })
    })

    it('should freeze output', () => {
        const model = Model.transform({})
        expect(Object.isFrozen(model)).to.equal(true)
    })
})

describe('model.state$', () => {
    it('should be an Observable', () => {
        const model = Model.transform({})
        expect(model.state$).to.be.an.instanceof(Observable)
    })

    it('should be inaccessible directly on the prototype', () => {
        expect(Model.prototype.state$).to.equal(undefined)
    })

    it('should emit state on subscription', done => {
        const model = new Model({foo: 'bar'})
        model.state$.subscribe(state => {
            done()
        })
    })

    it('should emit state on change', done => {
        const model = new Model({foo: 'bar'})
        model.state$.skip(1).subscribe(state => {
            done()
        })
        model.foo = 'baz'
    })

    it('should emit previous and next state', done => {
        const source = {foo: 'bar'}
        const model = new Model(source)
        model.state$.skip(1).subscribe(state => {
            expect(state.prev.foo).to.equal(source.foo)
            expect(state.next.foo).to.equal(model.foo)
            done()
        })
        model.foo = 'baz'
    })
})

