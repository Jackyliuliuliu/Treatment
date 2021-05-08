import { Component, HostBinding, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
        <router-outlet></router-outlet>`
})
export class RootComponent implements OnInit {

    layoutCollapsed = false;
    layoutFixed = true;
    layoutBoxed = false;

    @HostBinding('class.layout-fixed') get isFixed() {
        return this.layoutFixed;
    }

    @HostBinding('class.alain-default-layout-boxed') get isBoxed() {
        return this.layoutBoxed;
    }

    @HostBinding('class.alain-default__collapsed') get isCollapsed() {
        return this.layoutCollapsed;
    }

    ngOnInit(): void {
        // 相应菜单折叠的命令，折叠左边的菜单栏
        abp.event.on('abp.theme-setting.collapsed', collapsed => {
            this.layoutCollapsed = collapsed;
        });
    }
}
