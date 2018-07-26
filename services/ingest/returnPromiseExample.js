let start = Date.now();
function elapsed() {
  let rv = String(Date.now() - start);
  while (rv.length < 4) {
    rv = "0" + rv;
  }
  return rv;
}
function anotherPromise(type, val) {
  console.log(`${elapsed()}: anotherPromise[${type}] got ${val}`);
  return new Promise(resolve => {
    setTimeout(() => { resolve(val * 2); }, 1000);
  });
}
function anotherPromise2(type, val) {
  console.log(`${elapsed()}: anotherPromise2[${type}] got ${val}`);
  return new Promise(resolve => {
    setTimeout(() => { resolve(val * 3); }, 10);
  });
}
let user = {
  save: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(42);
      }, 10);
    });
  }
}

// Without return
user.save().then(function(val){
   anotherPromise("without", val);
}).then(function(val){
   anotherPromise2("without", val);
}).then(function() {
  console.log(`${elapsed()}: All done (without)`);
}).catch(function(err){
});

user.save().then(function(val){
   return anotherPromise("with", val);
}).then(function(val){
   return anotherPromise2("with", val);
}).then(function() {
  console.log(`${elapsed()}: All done (with)`);
}).catch(function(err){
});