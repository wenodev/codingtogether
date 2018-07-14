var SingletonClass = (function() {
	var mName,mNick,mId,mPwd,mIsLogin,instance;
	function SingletonClass() { }
	//setter
	this.__defineSetter__("mName",function(val){this.mName=val;});
	this.__defineSetter__("mNick",function(val){this.mNick=val;});
	this.__defineSetter__("mId",function(val){this.mId = val;});
	this.__defineSetter__("mPwd",function(val){this.mPwd = val;});
	this.__defineSetter__("mIsLogin",function(val){this.mIsLogin = val;});
	
	this.__defineGetter__("mName",function(){return mName;});
	this.__defineGetter__("mNick",function(){return mNick;});
	this.__defineGetter__("mId",function(){return mId;});
	this.__defineGetter__("mPwd",function(){return mPwd;});
	this.__defineGetter__("mIsLogin",function(){return mIsLogin;});
	return {
		getInstance: function() {
			if(instance == undefined){
			instance = new SingletonClass();
			instance.constructor = null;
			}
			return instance;
		}
	};
})();
