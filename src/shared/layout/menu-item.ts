export class MenuItem {
    name: string = '';
    permissionName: string = '';
    icon: string = '';
    route: string = '';
    isOpen:boolean = false;
    items: MenuItem[];

    constructor(name: string, permissionName: string, icon: string, route: string, isOpen: boolean = false, childItems: MenuItem[] = null) {
        this.name = name;
        this.permissionName = permissionName;
        this.icon = icon;
        this.route = route;
        this.isOpen = isOpen;

        if (childItems) {
            this.items = childItems;
        } else {
            this.items = [];
        }
    }
}
