const assert = require('assert')
const {type} = require('./index')

function log(first, ...args) {
  //if (log.quiet) return

  const {inspect} = require('util')

  const f = a => (typeof a === 'string') ?
    a : inspect(a, {depth:5, colors:true})

  console.log(first, ...args.map(a => inspect(a, {depth:5, colors:true})))
}


const {apply, transform} = type

const transformX = (left, right) =>
  [transform(left, right, 'left'), transform(right, left, 'right')]


function debugxf(orig, ops1, ops2) {
  const opc = [] // op cache

  // The indexes are the position in the diamond grid, from 0,0 to ops1.length,
  // ops2.length inclusive. the ops are the *inward arrows* toward that grid
  // cell, or undefined across the top.
  //
  // If you actually imagine the diamond, op1 and op2 are stored the wrong way
  // around in this array. But it sort of makes the code cleaner. *shrug*
  const set = (i1, i2, op1, op2, doc) => {
    if (!opc[i1]) opc[i1] = []
    opc[i1][i2] = [op1, op2, doc]
  }

  const get = (i1, i2) => {
    assert(opc[i1])
    assert(opc[i1][i2])
    return opc[i1][i2]
  }

  set(0, 0, undefined, undefined, orig)

  { // Top edges
    let d = orig
    ops1.forEach((op, i) => {
      d = apply(d, op)
      set(i+1, 0, op, undefined, d)
    })

    d = orig
    ops2.forEach((op, i) => {
      d = apply(d, op)
      set(0, i+1, undefined, op, d)
    })
  }

  log('----- diamond')

  for (let i1 = 0; i1 < ops1.length; i1++) {
    for (let i2 = 0; i2 < ops1.length; i2++) {
      const [op1, _, doc1] = get(i1+1, i2)
      const [__, op2, doc2] = get(i1, i2+1)
      log('----', i1, i2, op1, op2)

      const [op1_, op2_] = transformX(op1, op2)

      const doc12 = apply(doc1, op2_)
      const doc21 = apply(doc2, op1_)

      try {
        assert.deepStrictEqual(doc12, doc21)
      } catch (e) {
        console.error('*********** Blerp')

        log.quiet = false
        const orig = get(i1, i2)[2]
        log('Given document', orig)
        log('ops', op1, op2)
        log('->s', op1_, op2_)
        log('--- 1')
        log('op1', op1, doc1)
        log('op2', op2_, doc12)
        log('--- 2')
        log('op2', op2, doc2)
        log('op1', op1_, doc21)
        log('----> result', doc12, doc21)
        throw e
      }

      set(i1+1, i2+1, op1_, op2_, doc12)
    }
  }

  log('final result', get(ops1.length, ops2.length)[2])
}

debugxf(
  {"snicker":[[[[]],[[["He",""],"frabjous"]]],null,null]},
  [["snicker",0,1,0,1,{"r":true}],["snicker",1,{"r":true}],["snicker",0,1,0,{"d":0},0,0,{"p":0}]],
  [["snicker",1,{"r":true}],["snicker",0,1,0,{"r":true}],["snicker",0,0,0,{"p":0,"d":0}],["snicker",0,{"d":0},0,0,{"p":0}],[["and",{"d":0}],["snicker",{"p":0}]]])

/*
debugxf("hi there", [
  [{es:['simon says ']}]
], [
  [{es:[2, ' over']}]
])*/

/*
debugxf(['a', 'b'],
  [[[ 0, { p: 0 } ], [ 1, { d: 0 } ]]],
  [[1, { p: 0, d: 0 }]])
*/

debugxf([ { Twas: [ '', 'toves' ], mimsy: 0 } ],
  [ [ 0, 'Twas', [ 0, { p: 0 } ], [ 1, { d: 0 } ] ],
    [ 0, [ 'Twas', 2, { d: 0 } ], [ 'mimsy', { p: 0 } ] ],
    [ 0, 'Twas', [ 1, { p: 0 } ], [ 2, { d: 0 } ] ] ],
  [ [ 0, { i: 'the' } ],
    [ 0, { p: 0 }, 'and', { d: 0 } ],
    [ 0, 'Twas', 1, { p: 0, d: 0 } ],
    [ 0, { p: 0, d: 0 } ] ])