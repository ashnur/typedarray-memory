module.exports = Memory
var rand = Math.random

function Memory(type, size, cnstsize, silent){
  silent = silent || true
  cnstsize = cnstsize || 0
  var length = size + cnstsize + 1
  if ( (length) <= 256 ) {
    var address = new Uint8Array(length)
  } else if ( (length) <= Math.pow(2, 16) ) {
    var address = new Uint16Array(length)
  } else if ( (length) <= Math.pow(2, 32) ) {
    var address = new Uint32Array(length)
  } else if ( size > Math.pow(2, 32) ) {
    throw new Error('Maximum size is 2^32 - 1. You gave: '+ size + cnstsize)
  }

  var data = new type(length)

  var brk
  var last
  var unallocated = size

  var cnstbrk = 1
  var cnstlast = cnstsize
  var cnstua = cnstsize
  if ( cnstsize ) {
    for ( var i = 1; i < cnstsize ; i ++ ) {
      address[i] = i + 1
    }
    address[cnstsize] = 0
  }

  var ff = []
  var poss_free = 0

  init()

  return {
    data: data
  , ads: address
  , alloc: alloc
  , cnst: cnst
  , free: free
  , reset: reset
  , brk: function(){ return brk}
  , lst: function(){ return last}
  , unalloc: function(){ return unallocated}
  }

  function init(){
    for ( var i = cnstlast + 1; i < address.length - 1 ; i ++ ) {
      address[i] = i + 1
    }
    brk = cnstbrk + cnstua
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

  function cnst(length){
    if ( length > cnstua ) throw new Error('run out of memory')
    cnstua -= length
    var pointer = cnstbrk
    var end = pointer
    while ( --length > 0 && end ) {
      var end = address[end]
    }
    cnstbrk = cnstua ? address[end] : 0
    if ( ! cnstbrk) {
      last = 0
    }
    address[end] = 0
    return pointer
  }

  function free(pointer){
    if ( pointer < cnstlast ) {
      if ( silent ) return
      throw new Error('trying to free pointer: ' +
                      pointer + ' which is protected ' +
                      (pointer ? " because it's a constant" : '') )
    }
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
    if ( brk ) {
      address[prev] = brk
      address[last] = pointer
    } else {
      address[prev] = pointer
      last = prev
    }
    brk = pointer
    unallocated += count

  }

  function reset(){
    for ( var i = cnstlast + 1; i < data.length; i ++ ) {
      data[i] = 0
    }
    init()
  }
}

function print(n, pointer){
  var v = []
  var i = []
  var guard = 1000
  while (  pointer != 0  ) {
    if ( ! (guard --) ) throw new Error('print in free')
    v.push(data[pointer])
    pointer = address[pointer]
    i.push(pointer)
  }
  if ( ! v.length ) v.push(0)
  return console.log('mprint:' + n, v.join(', '), i)
}
