const assert = require('assert')
const { type } = require('../lib/json1')
const log = require('../lib/log')
const genOp = require('./genOp')
const deepClone = require('../lib/deepClone')

// This tests that none of apply / compose / transform / genOp mutate their input
describe('immutable guarantees', function() {
  const origDoc = { x: 'hi', y: 'omg', z: [1, 'whoa', 3] }
  const expectDoc = deepClone(origDoc)
  const n = 1000
  this.slow(n * 10)

  it('apply does not mutate', () => {
    const result = []
    for (
      let i = 1, end = n, asc = 1 <= end;
      asc ? i <= end : i >= end;
      asc ? i++ : i--
    ) {
      const [op, doc] = genOp(origDoc)
      assert.deepStrictEqual(origDoc, expectDoc)

      const expectOp = deepClone(op)
      type.apply(origDoc, op)

      assert.deepStrictEqual(origDoc, expectDoc)
      result.push(assert.deepStrictEqual(op, expectOp))
    }
    return result
  })

  it('compose does not mutate', () => {
    for (
      let i = 1, end = n, asc = 1 <= end;
      asc ? i <= end : i >= end;
      asc ? i++ : i--
    ) {
      let op2
      let [op1, doc] = genOp(origDoc)
      ;[op2, doc] = genOp(doc)

      const expectOp1 = deepClone(op1)
      const expectOp2 = deepClone(op2)
      type.compose(
        op1,
        op2
      )

      assert.deepStrictEqual(op1, expectOp1)
      assert.deepStrictEqual(op2, expectOp2)
    }
  })

  it('transform does not mutate', () => {
    for (
      let i = 1, end = n, asc = 1 <= end;
      asc ? i <= end : i >= end;
      asc ? i++ : i--
    ) {
      const [op1, doc1] = genOp(origDoc)
      const [op2, doc2] = genOp(origDoc)

      const expectOp1 = deepClone(op1)
      const expectOp2 = deepClone(op2)

      type.transformNoConflict(op1, op2, 'left')
      type.transformNoConflict(op2, op1, 'right')
      assert.deepStrictEqual(op1, expectOp1)
      assert.deepStrictEqual(op2, expectOp2)
    }
  })
})
