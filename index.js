module.exports = Memory

function Memory(type, size){
  if ( (size + 1) <= 256 ) {
    var address = new Uint8Array(size + 1)
  } else if ( (size + 1) <= Math.pow(2, 16) ) {
    var address = new Uint16Array(size + 1)
  } else if ( (size + 1) <= Math.pow(2, 32) ) {
    var address = new Uint32Array(size + 1)
  } else if ( size > Math.pow(2, 32) ) {
    throw new Error('Maximum size is 2^32 - 1. You gave: '+ size)
  }

  var data = new type(size + 1)
  var brk
  var last
  var unallocated = size

  init()

  return {
    data: data
  , ads: address
  , alloc: alloc
  , free: free
  , reset: reset
  , brk: function(){ return brk}
  , lst: function(){ return last}
  , unalloc: function(){ return unallocated}
  }

  function init(){
    for ( var i = 1; i < address.length - 1 ; i ++ ) {
      address[i] = i + 1
    }
    brk = 1
    last = i
    address[last] = brk
  }

  function alloc(length){
    if ( length > unallocated ) throw new Error('run out of memory')
    unallocated -= length
    var pointer = brk
    var end = pointer
    while ( --length > 0 && end ) {
      var end = address[end]
    }
    brk = unallocated ? address[end] : 0
    if ( brk ) {
      address[last] = brk
    } else {
      last = 0
    }
    address[end] = 0
    return pointer
  }

  function free(pointer){
    if ( address[pointer] != 0 ) {
      var prev = pointer
      var next = address[prev]
      var count = 1
      while ( next != 0 ) {
        data[prev] = 0
        prev = next
        next = address[prev]
        count++
      }
      data[prev] = 0
      var temp = brk
      brk = pointer
      if ( temp ) {
        address[prev] = temp
        address[last] = brk
      } else {
        address[prev] = brk
        last = prev
      }
      unallocated += count
    }
  }

  function reset(){
    for ( var i = 0; i < data.length; i ++ ) {
      data[i] = 0
    }
    init()
  }
}



function print(n, pointer){
  var v = []
  var i = []
  var guard = 3000
  while (  pointer != 0  ) {
    if ( ! (guard --) ) throw new Error('print in free')
    v.push(data[pointer])
    pointer = address[pointer]
    i.push(pointer)
  }
  if ( ! v.length ) v.push(0)
  return console.log('mprint:' + n, v.join(', '), i)
}
