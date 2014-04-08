var util = require('util')
  , async = require('async');

module.exports = function task(){
  return new Task();
}

function Task(){
  this._env = {};
  this._exts = {};
  this._tasks = [];
  this._finishedCb = null;
};

Task.prototype.env = function(env){
  this._env = env;
  return this;
};

Task.prototype.extend = function(key,func){
  this._exts[key] = func;
  return this;
};

Task.prototype.done = function(cb){
  this._finishedCb = cb;
  this._run();
};

Task.prototype.add = function(name,deps,func){
  var self = this;

  if(util.isArray(name)){
    name.forEach(function(n){
      self.add(n,deps,func);
    });
    return this;
  }
  
  if(typeof deps === 'function'){
    func = deps;
    deps = [];
  }
  
  if(this._findTask(name) !== null)
    throw new Error('Task ' + name + ' already defined');

  this._tasks.push({
    name : name,
    deps : deps,
    func : func
  });

  return this;
};

Task.prototype._run = function(){
  var self = this;
  async.eachLimit(this._tasks,1,this._runTask.bind(this), function(err){
    self._finishedCb(err);
  });
};

Task.prototype._runTask = function(task,cb){
  var self = this;

  if(task.ran){
    return cb();
  }
  
  function runDep(name,next){
    self._runDep(task,name,next);
  }

  async.eachLimit(task.deps,1,runDep, function(err){
    if(err)
      return cb(err);

    task.started = new Date();
    
    var obj = {};
    for(var key in self._exts){
      obj[key] = self._exts[key].bind(obj);
    }

    obj.name = task.name;
    obj.deps = task.deps;
    obj.env = self._env;

    task.func.call(obj,function(err){
      task.ran = new Date();
      return cb(err);
    });

  });
};


Task.prototype._runDep = function(parent,name,cb){
  var task = this._findTask(name);
  if(!task)
    return cb(new Error('Task '+name+' not found, needed for task '+parent.name));
  
  this._runTask(task,cb);
};


Task.prototype._findTask = function(name){
  var items = this._tasks.filter(function(t){
    return t.name === name;
  });
  
  if(items.length === 0)
    return null;
  
  return items[0];
};
