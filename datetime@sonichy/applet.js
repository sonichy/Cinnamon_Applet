const Applet = imports.ui.applet;
const Util = imports.misc.util;
const {GLib, Gio} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const Lang = imports.lang;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextApplet.prototype._init.call(this, orientation, panel_height, instance_id);        
        //global.logError('sonichy');
        this.settings = new Settings.AppletSettings(this, "datetime@sonichy", this.instance_id);
    	this.settings.bind("memo", "memo", this._onSettingsChanged);
    	
        this.set_applet_label("00:00\n1/1 一");
        this._applet_label.set_style("text-align:center");
        this.set_applet_tooltip(_("Tooltip"));
        this._applet_tooltip._tooltip.set_style("text-align:left");
        this.menuManager = new PopupMenu.PopupMenuManager(this);        
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        var label = new St.Label();
        this.menu.addActor(label);        
        
        //https://gjs.guide/guides/gjs/asynchronous-programming.html                  
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {            
	        var date = new Date();
	        var h = date.getHours();
	        if (h < 10)
	            h = "0" + h;
	        var m = date.getMinutes();
	        if (m < 10)
	            m = "0" + m;
	        var s = date.getSeconds();
	        if (s < 10)
	            s = "0" + s;
	        var m1 = (date.getMonth()+1);
	        var day = date.getDay();
	        var weekday = ["日", "一", "二", "三", "四", "五", "六"];
	        var s1 = h + ":" + m + "\n" + m1 + "/" + date.getDate() + " " + weekday[day];
	        this.set_applet_label(s1);
            s1 = date.getFullYear() + "/" + m1 + "/" + date.getDate() + " " + h + ":" + m + ":" + s + "\n" + this.memo;
        	this.set_applet_tooltip(s1);
        	label.set_text(s1);
        	return true; // loop
    	});   	
    	
    },
    
    on_applet_clicked: function() {
        //Util.spawnCommandLine("gnome-system-monitor");
        this.menu.toggle();
    },
    
    _onSettingsChanged() {
    }
    
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
