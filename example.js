var path = require('path');

var task = require('./task');

var cfiles = ['file_a.c','file_b.c'];

task()
  .env({gcc : '/usr/bin/gcc',cflags : '-Wall '})
  .add('somelib.a',cfiles,compileLib)
  .add('main.hex',['somelib.a','arduino.a'],compileLib)
  .add(cfiles,compileFile)
  .done(function(err){
    if(err)
      console.log(err);    
    console.log('done')
  });

function toO(f){
  return path.basename(f,path.extname(f)) + '.o';
}

function exec(cmd,callback){
  console.log(cmd);
  callback();
  // execute cmd string on OS when done run callback;
}

function compileLib(next){
  // this.deps => ['file_a.c','file_b.c']
  // this.name = 'somelib.a'
  // this.env = {gcc : '/usr/bin/gcc',cflags : '-Wall '}

  var cmd = [this.env.gcc,this.env.cflags,'-o',this.name].concat(this.deps.map(toO).join(' ')).join(' ');
  // cmd => /usr/bin/gcc -Wall -o somelib.a file_a.o file_b.o
  exec(cmd,next);
}

function compileFile(next){
  // this.deps => [];
  // this.name = 'file_a.c'
  var cmd = [this.env.gcc,this.env.cflags,'-o', toO(this.name),this.name ].join(' ');
  // cmd => /usr/bin/gcc -Wall -o file_a.o this.name
  exec(cmd,next);
}
