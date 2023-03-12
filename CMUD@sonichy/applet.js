const Applet = imports.ui.applet;
const Util = imports.misc.util;
const {GLib, Gio} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Cairo = imports.cairo;
var label1, label2, area_mem, area_cpu;
var db0 = 0, ub0 = 0, tt0=0, idle0 = 0, mp, cp;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.Applet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextApplet.prototype._init.call(this, orientation, panel_height, instance_id);        
        //global.logError('sonichy');
        area_mem = new St.DrawingArea();
        area_mem.width = 3;
        area_mem.height = panel_height;
        area_mem.connect('repaint', this.onRepaint_mem);
        this.actor.add(area_mem);
        
        label1 = new St.Label();
        label1.set_text("↑  0KB/s\n↓  0KB/s");
        //label1.style = "font-family: Noto Sans Mono";
        label1.set_style("font-family: Noto Sans Mono");
        this.actor.add(label1);
        
        area_cpu = new St.DrawingArea();
        area_cpu.width = 3;
        area_cpu.height = panel_height;
        area_cpu.connect('repaint', this.onRepaint_cpu);
        this.actor.add(area_cpu);
        
        this._applet_tooltip._tooltip.set_style("text-align:left");
        this.menuManager = new PopupMenu.PopupMenuManager(this);        
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        label2 = new St.Label();
        this.menu.addActor(label2);
        
        //https://gjs.guide/guides/gjs/asynchronous-programming.html
        //GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, this.update); //real name function do not run
          
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {        		
        	 var net = this.net();        	   	 
        	 label1.set_text("↑ " + this.B2G(net.ubs) + "/s\n↓ " + this.B2G(net.dbs) + "/s");        	 
        	 this.cpu();
         	 var s = _("Uptime: " + this.uptime() + "\nCPU: " + cp + "%\nMem: " + this.mem() + "\nUp: " + this.B2G(net.ub) + "\nDown: "+ this.B2G(net.db));
		 	 this.set_applet_tooltip(s); //resize flash
		 	 label2.set_text(s);
 		 	 area_mem.queue_repaint();
		 	 area_cpu.queue_repaint();
            return true; // loop
    	 });    	  
    },
    
    onRepaint_mem: function (area) {
        let cr = area.get_context();
        cr.setLineWidth(3);
        if (mp > 90)
            cr.setSourceRGBA(1, 0, 0, 1);
        else
            cr.setSourceRGBA(1, 1, 1, 1);
        cr.moveTo(0, area.height);
        cr.lineTo(0, area.height * (100 - mp) / 100);
        cr.stroke();
        cr.$dispose();
    },
    
    onRepaint_cpu: function (area) {
        let cr = area.get_context();
        cr.setLineWidth(3);        
        if (cp > 90)
            cr.setSourceRGBA(1, 0, 0, 1);
        else
            cr.setSourceRGBA(1, 1, 1, 1);
        cr.moveTo(0, area.height);
        cr.lineTo(0, area.height * (100 - cp) / 100);
        cr.stroke();
        cr.$dispose();
    },
    
    uptime: function() {
    	//https://gjs.guide/guides/gio/file-operations.html
        const file = Gio.File.new_for_path('/proc/uptime');
        const [, contents, etag] = file.load_contents(null);
        var t = contents.toString().split(' ');        
        var tt = Number(t[0]);
        var d = 0;
        if (tt > 86400) {
            d = tt / 86400;
            tt -= d * 86400;
         }
        var ds = "";
        if (d > 0)
            ds = d + "day";
        var h = ~~(tt/3600);
        if (h < 10)
            h = '0' + h;
        var m = ~~(tt%3600/60);
        if (m < 10)
            m = '0' + m;
        var s = ~~(tt%3600%60);
        if (s < 10)
            s = '0' + s;
        var hms = ds + h + ':' + m + ':' + s;
        return hms;
    },
    
    cpu: function() {
        const file = Gio.File.new_for_path('/proc/stat');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');
        var ca = s[0].split(/\s+/);
        var tt = 0;
        for (var i=1; i<ca.length; i++) {            
            tt += Number(ca[i]);
         }        
        var idle = Number(ca[4]);
        cp = ~~(((tt - tt0) - (idle - idle0)) * 100 / (tt - tt0));
        tt0 = tt;
        idle0 = idle;
    },
    
    mem: function() {
        const file = Gio.File.new_for_path('/proc/meminfo');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');        
        var MT = s[0].split(/\s+/);
        var MF = s[1].split(/\s+/);
        var mt = Number(MT[1]);
        var mf = Number(MF[1]);
        var mu = mt - mf;
        mp = ~~(mu / mt * 100);
        var m = this.B2G(mu*1024) + ' / '+ this.B2G(mt*1024) + ' = ' + mp + '%';
        return m;
    },
    
    net: function() {
        const file = Gio.File.new_for_path('/proc/net/dev');
        const [, contents, etag] = file.load_contents(null);
        var l = contents.toString().trim().split('\n');        
        var db = 0, ub = 0;        
        for (var i=2; i<l.length; i++) {
            var la = l[i].trim().split(/\s+/);
            db += Number(la[1]);
            ub += Number(la[9]);
         }
        var dbs = db - db0;
        var ubs = ub - ub0;
        db0 = db;
        ub0 = ub;
        return {db, ub, dbs, ubs};
    },
    
    B2G: function(b) {
        var s = '';
        if (b > 999999999) {
            b = b / (1024 * 1024 * 1024);
            if (b >= 100) {
                s = b.toFixed(0) + 'GB';
            } else if (b >= 10) {
                s = b.toFixed(1) + 'GB';
            } else {
                s = b.toFixed(2) + 'GB';
            }
        } else {
            if (b > 999999) {
                b = b / (1024 * 1024);
                if (b >= 100) {
                    s = b.toFixed(0) + 'MB';
                } else if (b >= 10) {
                    s = b.toFixed(1) + 'MB';
                } else {
                    s = b.toFixed(2) + 'MB';
                }
           } else {
                if (b > 999) {
                    b = b / 1024;
                    if (b >= 100) {
                        s = b.toFixed(0) + 'KB';
                    } else if (b >= 10) {
                        s = ' ' + b.toFixed(0) + 'KB';
                    } else {
                        s = '  ' + b.toFixed(0) + 'KB';
                    }
                } else {
                    if (b >= 100) {
                        s = b + ' B';
                    } else if (b >= 10) {
                        s = ' ' + b + ' B';
                    } else {
                        s = '  ' + b + ' B';
                    }
                }
            }
        }
        return s;
    },
    
    update: function() {
        var date = new Date();
        var s = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate() + "\n" + date.getHours() + ":" + date.getMinutes()+ ":" + date.getSeconds();
        this.set_applet_label(s);
        return true;	// loop
    },

    on_applet_clicked: function() {
        //Util.spawnCommandLine("gnome-system-monitor");
        this.menu.toggle();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
