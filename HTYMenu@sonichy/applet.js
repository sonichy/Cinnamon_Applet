const Applet = imports.ui.applet;
const Cinnamon = imports.gi.Cinnamon;
const CMenu = imports.gi.CMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const GnomeSession = imports.misc.gnomeSession;
const Util = imports.misc.util;
const Settings = imports.ui.settings;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        
        this.settings = new Settings.AppletSettings(this, 'HTYMenu@sonichy', instance_id);
        this.settings.bind('menu-icon', 'menuIcon', this.updateIcon);
        
        if (this.menuIcon == '')
            this.menuIcon = 'cinnamon-symbolic';
        this.set_applet_icon_name(this.menuIcon);
        this.set_applet_tooltip(_('HTYMenu'));
        
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);        
        this.session = new GnomeSession.SessionManager();
        
        // /usr/share/cinnamon/applets/menu@cinnamon.org/appUtils.js
        this.appsys = Cinnamon.AppSystem.get_default();
        this.appsys.connect('installed-changed', () => this.genMenu());
        this.genMenu();        
    },
    
    on_applet_clicked: function() {
        this.menu.toggle();        
    },
    
    updateIcon() {
        this.set_applet_icon_name(this.menuIcon);
    },
    
    genMenu() {
        this.menu.removeAll();
        let tree = this.appsys.get_tree();
        let root = tree.get_root_directory();
        let iter = root.iter();
        let nextType;
        while (nextType = iter.next()) {
            if (nextType == CMenu.TreeItemType.DIRECTORY) {
                let dir = iter.get_directory();
                let subMenu = new PopupMenu.PopupSubMenuMenuItem(dir.get_name());
                //subMenu.icon.icon_name = dir.get_icon().to_string(); //不支持
                this.menu.addMenuItem(subMenu);
                let iter1 = dir.iter();
                let nextType1;
                while (nextType1 = iter1.next()) {
                    if (nextType1 == CMenu.TreeItemType.ENTRY) {                
                        let desktopId = iter1.get_entry().get_desktop_file_id();                        
                        let app = this.appsys.lookup_app(desktopId);
                        let info = app.get_app_info();
                        //global.logError(info.get_icon().to_string());
                        //subMenu.menu.addAction(app.get_name(), () => app.open_new_window(-1)); //不支持图标
                        let menuItem;
                        if (info.get_icon())
                            menuItem = new PopupMenu.PopupIconMenuItem(app.get_name(), info.get_icon().to_string(), St.IconType.FULLCOLOR);
                        else
                            menuItem = new PopupMenu.PopupIconMenuItem(app.get_name(), 'applications-system', St.IconType.FULLCOLOR);                        
                        menuItem.activate = () => {
                            this.menu.close();
                            app.open_new_window(-1);
                        };
                        subMenu.menu.addMenuItem(menuItem);
                    }
                }
            }
        }
        
        //关机
        let subMenu = new PopupMenu.PopupSubMenuMenuItem('关机');
        
        let menuItem = new PopupMenu.PopupIconMenuItem('锁定', 'system-lock-screen', St.IconType.FULLCOLOR);
        menuItem.activate = () => {
            this.menu.close();
            Util.spawnCommandLine("cinnamon-screensaver-command --lock");
        };
        subMenu.menu.addMenuItem(menuItem);
        
        menuItem = new PopupMenu.PopupIconMenuItem('注销', 'system-log-out', St.IconType.FULLCOLOR);
        menuItem.activate = () => {
            this.session.LogoutRemote(0);
        };
        subMenu.menu.addMenuItem(menuItem);        
        
        menuItem = new PopupMenu.PopupIconMenuItem('关机', 'system-shutdown', St.IconType.FULLCOLOR);
        menuItem.activate = () => {        
            this.session.ShutdownRemote();
        };
        subMenu.menu.addMenuItem(menuItem);        
        
        this.menu.addMenuItem(subMenu);
    }
    
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
