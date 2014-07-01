var test = require('tape')
var memory = require('../index.js')(Uint8Array, 32)
var liberate = require('liberate')
var map = liberate(Array.prototype.map)
var reduce = liberate(Array.prototype.reduce)
var every = liberate(Array.prototype.every)
var slice = liberate(Array.prototype.slice)
var join = liberate(Array.prototype.join)
var fromCharCode = function(num){ return String.fromCharCode(num) }

function add(x, y){ return x + y }
function sum(xs){ return reduce(xs, add) }
function isZero(x){ return x === 0 }
function points2next(c, i, arr){
  var expected_value = i == 0              ? 0
                     : i <  arr.length - 1 ? i + 1
                     :                       1
  return c == expected_value
}
test('init', function(t){
  t.ok(memory.data  instanceof Uint8Array, 'type is Uint8Array')
  t.ok(memory.data.length == 33, 'data length is 33')
  t.ok(every(memory.data, isZero), 'data is empty')
  t.ok(memory.ads  instanceof Uint8Array, 'index type is Uint8Array')
  t.ok(memory.ads.length == 33, 'index data length is 33')
  t.ok(every(memory.ads, points2next), 'index is correctly inited')
  t.end()
})


function saveString(str){
  var pointer = memory.alloc(str.length)
  var idx = pointer
  var i = 0
  var guard = 33
  // console.log('trying to save', str)
  while ( idx != 0 ) {
    //  console.log('d', idx, str.charCodeAt(i))
    if ( ! (--guard) ) throw 'end'
    memory.data[idx] = str.charCodeAt(i++)
    idx = memory.ads[idx]
  }
  return pointer
}

function readString(pointer){
  var values = []
  var idx = pointer
  var guard = 33
  while ( idx != 0 ) {
    if ( ! (--guard) ) throw 'end'
    values.push(memory.data[idx])
    idx = memory.ads[idx]
  }
  return join(map(values, fromCharCode), '')
}

test('alloc', function(t){
  var str = 'Hello World!'
  var p = saveString(str)
  t.ok(str == readString(p), 'storing and restoring')
  t.end()
})

function dump(){
  var values = slice(memory.data,0)
  var val_out = []
  values.forEach(function(v, i){
    val_out.push([v+ ', ' +fromCharCode(v)+ ',' + i])
  })
  // console.log('values')
  // console.log(val_out.join('|'))
  var indeces = slice(memory.ads,0)
  var ind_out = []
  indeces.forEach(function(v, i){
    ind_out.push(i+ ',' + v )
  })
  // console.log('indeces')
  // console.log(ind_out.join('|'))
  // console.log('break', memory.brk())
  // console.log('last', memory.lst())
  // console.log('unalloc', memory.unalloc())
}

test('free', function(t){
  var brave = saveString('brave')
  var newish = saveString('new')
  var world = saveString('world')
  // dump()
  t.ok('new' == readString(newish), 'storing and restoring')
  memory.free(newish)
  // dump()
  t.ok('brave' == readString(brave), 'storing and restoring')
  t.ok('world' == readString(world), 'storing and restoring')
  var antic_hay = saveString('antic hays')
  t.ok('antic hays' == readString(antic_hay), 'storing and restoring')
  // dump()
  memory.free(world)
  // dump()
  memory.free(antic_hay)
  // dump()
  memory.free(brave)
  // dump()

  var st = saveString('starship trooperssss')
  t.ok('starship trooperssss' == readString(st), 'storing and restoring')
  // dump()

  t.end()
})

test('reset', function(t){
  memory.reset()
  t.ok(every(memory.data, isZero), 'data is empty')
  t.ok(every(memory.ads, points2next), 'index is correctly inited')
  t.end()

})
